from slugify import slugify
import re

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    return slugify(title, max_length=100)

def extract_keywords_from_text(text: str) -> str:
    """Extract potential keywords from text (simple implementation)"""
    if not text:
        return ""
    
    # Remove common words and extract meaningful terms
    common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
    
    # Extract words (simple approach)
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    keywords = [word for word in words if word not in common_words]
    
    # Return top 10 most frequent words
    from collections import Counter
    word_counts = Counter(keywords)
    top_keywords = [word for word, count in word_counts.most_common(10)]
    
    return ', '.join(top_keywords)

def generate_meta_description(abstract: str, max_length: int = 160) -> str:
    """Generate SEO meta description from abstract"""
    if not abstract:
        return ""
    
    if len(abstract) <= max_length:
        return abstract
    
    # Truncate at word boundary
    truncated = abstract[:max_length]
    last_space = truncated.rfind(' ')
    if last_space > 0:
        truncated = truncated[:last_space]
    
    return truncated + "..."