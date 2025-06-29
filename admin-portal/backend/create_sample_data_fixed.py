import sys
import os
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.project import Project
from app.core.utils import create_slug, generate_meta_description
from datetime import datetime, timedelta
import random

def create_sample_projects():
    db = SessionLocal()
    
    try:
        # Check if projects already exist
        existing_count = db.query(Project).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} projects. Skipping sample data creation.")
            return
        
        sample_projects = [
            {
                "title": "Machine Learning Applications in Healthcare Diagnosis",
                "abstract": "This research explores the implementation of machine learning algorithms for early disease detection and diagnosis in healthcare systems. The study focuses on developing predictive models that can analyze medical imaging data to identify potential health issues before they become critical.",
                "research_area": "Computer Science",
                "degree_type": "Master's",
                "academic_year": "2023-2024",
                "institution": "Stanford University",
                "department": "Computer Science",
                "supervisor": "Dr. Sarah Johnson",
                "author_name": "John Smith",
                "author_email": "john.smith@stanford.edu"
            },
            {
                "title": "Sustainable Energy Solutions for Urban Development",
                "abstract": "An investigation into renewable energy integration in modern urban planning. This study examines the feasibility and impact of solar, wind, and geothermal energy systems in metropolitan areas, focusing on cost-effectiveness and environmental benefits.",
                "research_area": "Environmental Engineering",
                "degree_type": "PhD",
                "academic_year": "2023-2024",
                "institution": "MIT",
                "department": "Environmental Engineering",
                "supervisor": "Prof. Michael Chen",
                "author_name": "Emily Rodriguez",
                "author_email": "e.rodriguez@mit.edu"
            },
            {
                "title": "Digital Marketing Strategies in the Post-Pandemic Era",
                "abstract": "This business research analyzes the evolution of digital marketing strategies following the COVID-19 pandemic. The study examines consumer behavior changes and how businesses have adapted their marketing approaches to reach customers in the digital-first economy.",
                "research_area": "Business Administration",
                "degree_type": "Master's",
                "academic_year": "2023-2024",
                "institution": "Harvard Business School",
                "department": "Marketing",
                "supervisor": "Dr. Lisa Wang",
                "author_name": "David Thompson",
                "author_email": "d.thompson@hbs.edu"
            },
            {
                "title": "Neuroplasticity and Learning in Early Childhood Development",
                "abstract": "A comprehensive study on brain plasticity during early childhood and its implications for educational methodologies. This research investigates how neural pathways develop in children aged 3-7 and proposes evidence-based learning strategies.",
                "research_area": "Psychology",
                "degree_type": "PhD",
                "academic_year": "2022-2023",
                "institution": "University of California, Berkeley",
                "department": "Psychology",
                "supervisor": "Dr. Amanda Foster",
                "author_name": "Maria Garcia",
                "author_email": "m.garcia@berkeley.edu"
            },
            {
                "title": "Blockchain Technology in Supply Chain Management",
                "abstract": "This research examines the implementation of blockchain technology to improve transparency and efficiency in global supply chains. The study includes case studies from various industries and proposes a framework for blockchain adoption.",
                "research_area": "Information Systems",
                "degree_type": "Master's",
                "academic_year": "2023-2024",
                "institution": "Carnegie Mellon University",
                "department": "Information Systems",
                "supervisor": "Prof. Robert Kim",
                "author_name": "Alex Johnson",
                "author_email": "a.johnson@cmu.edu"
            },
            {
                "title": "Climate Change Impact on Marine Ecosystems",
                "abstract": "An extensive study on how rising ocean temperatures and acidification affect marine biodiversity. This research includes field studies from multiple oceanic regions and proposes conservation strategies for vulnerable marine species.",
                "research_area": "Marine Biology",
                "degree_type": "PhD",
                "academic_year": "2022-2023",
                "institution": "Woods Hole Oceanographic Institution",
                "department": "Marine Biology",
                "supervisor": "Dr. Jennifer Martinez",
                "author_name": "Thomas Wilson",
                "author_email": "t.wilson@whoi.edu"
            },
            {
                "title": "Artificial Intelligence in Educational Assessment",
                "abstract": "This study explores the use of AI-powered tools for student assessment and personalized learning. The research develops algorithms that can provide real-time feedback and adapt to individual learning styles and pace.",
                "research_area": "Educational Technology",
                "degree_type": "Master's",
                "academic_year": "2023-2024",
                "institution": "Georgia Institute of Technology",
                "department": "Educational Technology",
                "supervisor": "Dr. Kevin Lee",
                "author_name": "Sarah Brown",
                "author_email": "s.brown@gatech.edu"
            },
            {
                "title": "Quantum Computing Applications in Cryptography",
                "abstract": "A theoretical and practical exploration of quantum computing's potential to revolutionize cryptographic systems. This research investigates quantum algorithms and their implications for current security protocols.",
                "research_area": "Computer Science",
                "degree_type": "PhD",
                "academic_year": "2023-2024",
                "institution": "Caltech",
                "department": "Computer Science",
                "supervisor": "Prof. Daniel Zhang",
                "author_name": "Rachel Davis",
                "author_email": "r.davis@caltech.edu"
            }
        ]
        
        print(f"Creating {len(sample_projects)} sample projects...")
        
        for i, project_data in enumerate(sample_projects, 1):
            # Create slug
            slug = create_slug(project_data["title"])
            
            # Generate meta description
            meta_description = generate_meta_description(project_data["abstract"])
            
            # Create keywords from abstract
            keywords = project_data["research_area"] + ", " + project_data["degree_type"]
            
            # Random publication date within last year
            days_ago = random.randint(1, 365)
            publication_date = datetime.now() - timedelta(days=days_ago)
            
            project = Project(
                title=project_data["title"],
                slug=slug,
                abstract=project_data["abstract"],
                keywords=keywords,
                research_area=project_data["research_area"],
                degree_type=project_data["degree_type"],
                academic_year=project_data["academic_year"],
                institution=project_data["institution"],
                department=project_data["department"],
                supervisor=project_data["supervisor"],
                author_name=project_data["author_name"],
                author_email=project_data["author_email"],
                is_published=True,
                publication_date=publication_date,
                meta_description=meta_description,
                view_count=random.randint(10, 500),
                download_count=random.randint(5, 100)
            )
            
            db.add(project)
            print(f"  {i}. Added: {project_data['title']}")
        
        db.commit()
        print("✅ Sample projects created successfully!")
        
        # Verify creation
        total_projects = db.query(Project).count()
        print(f"✅ Total projects in database: {total_projects}")
        
    except Exception as e:
        print(f"❌ Error creating sample projects: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_projects()