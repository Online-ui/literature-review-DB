from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import secrets
import string
from datetime import datetime, timedelta
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
    TEMPLATE_FOLDER='app/templates/email',
    TIMEOUT=60  # Increase timeout to 60 seconds
)

fm = FastMail(conf)

def generate_reset_token(length: int = 32) -> str:
    """Generate a secure alphanumeric token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


async def send_password_reset_email(email: EmailStr, username: str, reset_url: str):
    """Send password reset email with the complete reset URL"""
    try:
        # Extract token from URL for display
        token = reset_url.split('token=')[-1] if 'token=' in reset_url else ''
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                    margin: -30px -30px 30px -30px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(10, 79, 60, 0.3);
                }}
                .token-box {{
                    background-color: #e8f5e9;
                    border: 2px solid #0a4f3c;
                    padding: 15px;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    text-align: center;
                    margin: 20px 0;
                    letter-spacing: 1px;
                    word-break: break-all;
                    color: #0a4f3c;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
                .url-box {{
                    background-color: #f0f0f0;
                    padding: 10px;
                    border-radius: 5px;
                    word-break: break-all;
                    font-size: 12px;
                    margin: 10px 0;
                    color: #333;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                
                <p>Hello <strong>{username}</strong>,</p>
                
                <p>We received a request to reset your password for the Research Hub Admin Portal. 
                If you didn't make this request, you can safely ignore this email.</p>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> This link will expire in 30 minutes for security reasons.
                </div>
                
                <p><strong>Your password reset token is:</strong></p>
                
                <div class="token-box">
                    {token}
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                
                <div class="url-box">
                    {reset_url}
                </div>
                
                <p><strong>Security Notes:</strong></p>
                <ul>
                    <li>This link can only be used once</li>
                    <li>Your password won't change until you create a new one</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                </ul>
                
                <div class="footer">
                    <p>This is an automated email from Research Hub Admin Portal.</p>
                    <p>Please do not reply to this email.</p>
                    <p>&copy; 2025 Research Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        message = MessageSchema(
            subject="Password Reset Request - Research Hub Admin Portal",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )
        
        await fm.send_message(message)
        logger.info(f"✅ Password reset email sent successfully to {email}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email to {email}: {str(e)}")
        # Don't raise the exception - allow the request to complete
        # The user will still get their reset token in the response


async def send_reset_password_email(email: EmailStr, token: str, username: str):
    """Legacy function - redirects to new function for backward compatibility"""
    reset_url = f"{settings.FRONTEND_URL}/#/reset-password?token={token}"
    await send_password_reset_email(email, username, reset_url)


async def send_password_reset_confirmation(email: EmailStr, username: str):
    """Send confirmation email after successful password reset"""
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                    margin: -30px -30px 30px -30px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .success {{
                    background-color: #e8f5e9;
                    border: 2px solid #4caf50;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .success-icon {{
                    font-size: 48px;
                    color: #4caf50;
                    margin-bottom: 10px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(10, 79, 60, 0.3);
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
                .security-tips {{
                    background-color: #f0f8ff;
                    border-left: 4px solid #0a4f3c;
                    padding: 15px;
                    margin: 20px 0;
                }}
                .security-tips ul {{
                    margin: 10px 0;
                    padding-left: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Successful</h1>
                </div>
                
                <p>Hello <strong>{username}</strong>,</p>
                
                <div class="success">
                    <div class="success-icon">✓</div>
                    <h2 style="color: #0a4f3c; margin: 0;">Your password has been successfully reset!</h2>
                </div>
                
                <p>You can now log in to the Research Hub Admin Portal with your new password.</p>
                
                <div style="text-align: center;">
                    <a href="{settings.FRONTEND_URL}/#/login" class="button">Go to Login</a>
                </div>
                
                <div class="security-tips">
                    <p><strong>🔒 Security Tips:</strong></p>
                    <ul>
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Use a unique password for this account</li>
                        <li>Consider using a password manager</li>
                    </ul>
                </div>
                
                <p>If you didn't make this change, please contact the administrator immediately.</p>
                
                <div class="footer">
                    <p>This is an automated email from Research Hub Admin Portal.</p>
                    <p>Please do not reply to this email.</p>
                    <p>&copy; 2025 Research Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        message = MessageSchema(
            subject="Password Reset Successful - Research Hub Admin Portal",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )
        
        await fm.send_message(message)
        logger.info(f"✅ Password reset confirmation sent successfully to {email}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send confirmation email to {email}: {str(e)}")
        # Don't raise the exception - this is not critical
