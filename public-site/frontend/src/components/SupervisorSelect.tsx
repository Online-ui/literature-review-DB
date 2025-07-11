import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface Supervisor {
  id: string;
  name: string;
  institution: string;
  title: string;
  email: string;
}

interface SupervisorSelectProps {
  value: string;
  onChange: (supervisorId: string, customName?: string) => void;
  institution?: string;
  error?: string;
  customSupervisorName?: string;
  onCustomNameChange?: (name: string) => void;
}

const SupervisorSelect: React.FC<SupervisorSelectProps> = ({
  value,
  onChange,
  institution,
  error,
  customSupervisorName,
  onCustomNameChange
}) => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [supervisorsByInstitution, setSupervisorsByInstitution] = useState<Record<string, Supervisor[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(value === 'others');

  useEffect(() => {
    fetchSupervisors();
  }, [institution, searchTerm]);

  useEffect(() => {
    setShowCustomInput(value === 'others');
  }, [value]);

  const fetchSupervisors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (institution) params.institution = institution;
      if (searchTerm) params.search = searchTerm;

      const response = await adminApi.get('/projects/supervisors/options', { params });
      
      if (searchTerm) {
        setSupervisors(response.data.supervisors || []);
      } else {
        setSupervisorsByInstitution(response.data.supervisors_by_institution || {});
        setSupervisors(response.data.all_supervisors || []);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisorChange = (supervisorId: string) => {
    onChange(supervisorId, supervisorId === 'others' ? customSupervisorName : undefined);
  };

  const handleCustomNameChange = (name: string) => {
    if (onCustomNameChange) {
      onCustomNameChange(name);
    }
    onChange('others', name);
  };

  const renderGroupedOptions = () => {
    if (searchTerm || institution) {
      return supervisors.map((supervisor) => (
        <option key={supervisor.id} value={supervisor.id}>
          {supervisor.name} {supervisor.institution && `(${supervisor.institution})`}
        </option>
      ));
    }

    return Object.entries(supervisorsByInstitution).map(([institutionName, institutionSupervisors]) => (
      <optgroup key={institutionName} label={institutionName}>
        {institutionSupervisors.map((supervisor) => (
          <option key={supervisor.id} value={supervisor.id}>
            {supervisor.name}
          </option>
        ))}
      </optgroup>
    ));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supervisor
        </label>
        
        {/* Search input */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search supervisors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Supervisor dropdown */}
        <select
          value={value}
          onChange={(e) => handleSupervisorChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        >
          <option value="">Select a Supervisor</option>
          {renderGroupedOptions()}
        </select>

        {loading && (
          <p className="text-sm text-gray-500 mt-1">Loading supervisors...</p>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>

      {/* Custom supervisor name input */}
      {showCustomInput && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supervisor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter supervisor's full name"
            value={customSupervisorName || ''}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Please provide the full name of the external supervisor
          </p>
        </div>
      )}

      {/* Selected supervisor info */}
      {value && value !== 'others' && (
        <div className="bg-blue-50 p-3 rounded-md">
          {(() => {
            const selectedSupervisor = supervisors.find(s => s.id === value);
            if (selectedSupervisor) {
              return (
                <div className="text-sm">
                  <p className="font-medium text-blue-900">{selectedSupervisor.name}</p>
                  <p className="text-blue-700">{selectedSupervisor.institution}</p>
                  {selectedSupervisor.email && (
                    <p className="text-blue-600">{selectedSupervisor.email}</p>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

export default SupervisorSelect;
