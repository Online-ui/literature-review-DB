from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import secrets
import string
from datetime import datetime, timedelta

from .config import settings

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
    TEMPLATE_FOLDER='app/templates/email'
)

fm = FastMail(conf)

def generate_reset_token(length: int = 32) -> str:
    """Generate a secure alphanumeric token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def send_reset_password_email(email: EmailStr, token: str, username: str):
    """Send password reset email"""
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .container {{
                background-color: #f4f4f4;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .header {{
                background-color: #1b5e20;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
                margin: -30px -30px 30px -30px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background-color: #1b5e20;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .token-box {{
                background-color: #e8f5e9;
                border: 2px solid #1b5e20;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 18px;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 2px;
            }}
            .footer {{
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            
            <p>Hello {username},</p>
            
            <p>We received a request to reset your password for the UHAS Research Hub Admin Portal.</p>
            
            <p><strong>Your password reset token is:</strong></p>
            
            <div class="token-box">
                {token}
            </div>
            
            <p>You can also click the button below to go directly to the password reset page:</p>
            
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This token will expire in 15 minutes</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
            </ul>
            
            <div class="footer">
                <p>This is an automated email from UHAS Research Hub Admin Portal.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Password Reset Request - UHAS Research Hub Admin",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    await fm.send_message(message)

async def send_password_reset_confirmation(email: EmailStr, username: str):
    """Send confirmation email after successful password reset"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .container {{
                background-color: #f4f4f4;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .header {{
                background-color: #1b5e20;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
                margin: -30px -30px 30px -30px;
            }}
            .success {{
                background-color: #e8f5e9;
                border: 2px solid #4caf50;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Successful</h1>
            </div>
            
            <p>Hello {username},</p>
            
            <div class="success">
                <h2 style="color: #1b5e20; margin: 0;">✓ Your password has been successfully reset!</h2>
            </div>
            
            <p>You can now log in to the UHAS Research Hub Admin Portal with your new password.</p>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
                <li>Keep your password secure and don't share it with anyone</li>
                <li>Use a unique password for this account</li>
                <li>Consider using a password manager</li>
            </ul>
            
            <p>If you didn't make this change, please contact the administrator immediately.</p>
            
            <div class="footer">
                <p>This is an automated email from UHAS Research Hub Admin Portal.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Password Reset Successful - UHAS Research Hub Admin",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    await fm.send_message(message)
