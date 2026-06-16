import urllib.request
import re
from html.parser import HTMLParser

class CyclingScraper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current_header = None
        self.in_header = False
        self.in_content_block = False
        
        # Accumulators
        self.descriptions = []
        self.syntax_blocks = []
        
    def handle_starttag(self, tag, attrs):
        # Identify section headers
        if tag in ['h1', 'h2', 'h3', 'h4']:
            self.in_header = True
            
        # Capture content block containers or paragraph text under targeted headers
        if self.current_header in ['Description', 'Constructors'] and tag in ['p', 'code', 'pre', 'div']:
            self.in_content_block = True

    def handle_endtag(self, tag):
        if tag in ['h1', 'h2', 'h3', 'h4']:
            self.in_header = False
        if tag in ['p', 'code', 'pre', 'div']:
            self.in_content_block = False

    def handle_data(self, data):
        clean_data = data.strip()
        if not clean_data:
            return
            
        # Check if we are reading a new section title
        if self.in_header:
            if clean_data in ['Description', 'Constructors', 'Syntax']:
                self.current_header = clean_data
            else:
                self.current_header = None # Reset if it's another section
                
        # Scrape information based on active section context
        elif self.in_content_block:
            if self.current_header == 'Description':
                # Avoid capturing sub-heading text or navigation artifacts
                if clean_data not in ['Description', 'Constructors', 'Inlets', 'Attributes']:
                    self.descriptions.append(clean_data)
            elif self.current_header == 'Constructors':
                # Clean structural formatting noise out of raw code data if present
                if clean_data not in ['Constructors', '{', '}']:
                    self.syntax_blocks.append(clean_data)

def scrape_operator_reference(url):
    try:
        # Include a standard User-Agent header to prevent 403 Forbidden errors
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html_content = response.read().decode('utf-8')
            
        # Parse the extracted document
        parser = CyclingScraper()
        parser.feed(html_content)
        
        # Assemble clean output strings
        full_description = " ".join(parser.descriptions)
        
        # Format constructors layout into readable syntax definitions
        full_syntax = []
        for block in parser.syntax_blocks:
            # Reconstruct inline JSON/Object parameters cleanly if split by parser tags
            if block.startswith("arguments=") or block.startswith("inlets="):
                if full_syntax:
                    full_syntax[-1] = f"{full_syntax[-1]} {block}"
                    continue
            full_syntax.append(block)
            
        # Fallback optimization if clean text array requires structural join
        joined_syntax = "\n".join(full_syntax) if full_syntax else "Syntax not found"
        
        return {
            "syntax": joined_syntax,
            "description": full_description if full_description else "Description not found"
        }
        
    except Exception as e:
        return {"error": f"Failed to retrieve or parse data: {str(e)}"}

# --- Execution Example ---
if __name__ == "__main__":
    target_url = "https://docs.cycling74.com/reference/gen_common_param/"
    result = scrape_operator_reference(target_url)
    
    # Beautifully print out the resulting dictionary
    import json
    print(json.dumps(result, indent=4))