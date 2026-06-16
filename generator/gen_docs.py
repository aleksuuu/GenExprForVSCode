import urllib.request
from html.parser import HTMLParser
import json

class RobustCyclingScraper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current_section = None
        self.in_header = False
        self.stop_scraping = False
        
        # Accumulators
        self.descriptions = []
        self.syntax_blocks = []
        self.attributes = {}

        self.attribute_key = None
        self.attribute_sub_key = None

        self.will_set_attribute_key = False
        
    def handle_starttag(self, tag, attrs):
        if self.stop_scraping:
            return
            
        # If we hit any header tag, we flag that we are reading a section title
        if tag in ['h1', 'h2']:
            self.in_header = True
        elif tag == "span" and attrs and attrs[0][0] == 'class':
            class_name = attrs[0][1]
            if class_name == 'name':
                self.will_set_attribute_key = True
            else:
                self.attribute_sub_key = class_name
        elif tag == 'p' and attrs == [('class', 'description')]:
            self.attribute_sub_key = 'description'

    def handle_endtag(self, tag):
        if tag in ['h1', 'h2']:
            self.in_header = False
            


    def handle_data(self, data):
        if self.stop_scraping:
            return
            
        clean_data = data.strip()
        if not clean_data:
            return
            
        # Case A: We are currently inside a header tag reading a section title
        if self.in_header:
            if clean_data in ['Description', 'Constructors', 'Attributes', 'Inlets']:
                self.current_section = clean_data
            else:
                # If it's a heading we don't care about, pause accumulating data
                self.current_section = None
                
        # Case B: We are reading regular text bodies under a tracked section
        elif self.current_section:
            if clean_data == 'Common Box Attributes':
                self.stop_scraping = True
                self.current_section = None
            elif self.current_section == 'Description':
                self.descriptions.append(clean_data)
            elif self.current_section == 'Constructors':
                if clean_data not in ['{', '}']:
                    self.syntax_blocks.append(clean_data)
            elif self.current_section == 'Attributes':
                if self.will_set_attribute_key:
                    self.attribute_key = clean_data
                    self.attributes[self.attribute_key] = {}
                    self.will_set_attribute_key = False
                elif self.attribute_sub_key:
                    current_v = self.attributes[self.attribute_key].get(self.attribute_sub_key)
                    if current_v:
                        self.attributes[self.attribute_key][self.attribute_sub_key] = current_v + "\n\n" + clean_data
                    else:
                        self.attributes[self.attribute_key][self.attribute_sub_key] = clean_data
                    # print(clean_data)
                    # self.attributes[self.attribute_key][self.attribute_sub_key] = self.attributes[self.attribute_key].get(self.attribute_sub_key, "") + "\n" + clean_data

def scrape_operator_reference(suffix):
    url = f"https://docs.cycling74.com/reference/{suffix}/"
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html_content = response.read().decode('utf-8')
            
        parser = RobustCyclingScraper()
        parser.feed(html_content)
        
        # Format Constructors
        full_syntax = []
        for block in parser.syntax_blocks:
            if block.startswith("arguments=") or block.startswith("inlets="):
                if full_syntax:
                    full_syntax[-1] = f"{full_syntax[-1]} {block}"
                    continue
            full_syntax.append(block)
        joined_syntax = "\n".join(full_syntax) if full_syntax else "Syntax not found"
        
        # Format Description
        full_description = " ".join(parser.descriptions)
        
        # Format Specific Object Attributes
        # joined_attributes = "".join(parser.attributes) if parser.attributes else "Attributes not found"
        joined_attributes = ""
        if not parser.attributes:
            joined_attributes = ""
        else:
            for key, value in parser.attributes.items():
                joined_attributes += f"#### {key} "
                for k, v in value.items():
                    if v == "" or v == ":": 
                        joined_attributes += ""
                    elif k == 'type' or k == 'defaultval':
                        joined_attributes += f"*{v}* "
                    elif k == 'gs':
                        joined_attributes += f"*({v})* "
                    elif k == 'description':
                        joined_attributes += f"\n{v}\n"
        
        return {
            "syntax": joined_syntax,
            "description": full_description if full_description else "Description not found",
            "attributes": joined_attributes,
            "suffix": suffix
        }
        
    except Exception as e:
        return {"error": f"Failed to retrieve or parse data: {str(e)}"}

if __name__ == "__main__":
    import csv
    docs = {}
    with open('generator/gen_common_operators_links.csv', newline='') as csvfile:
        csvreader = csv.reader(csvfile)
        for row in csvreader:
            key = row[0]
            suffix = row[1]
            print(f'scraping {suffix}')
            result = scrape_operator_reference(suffix)
            docs[key] = result

    # key = "sample"
    # suffix = "gen_jit_sample"
    
    # docs = scrape_operator_reference(suffix)
    # docs = {key: docs}

    with open("docs3.json", "w") as f:
        json.dump(docs, f, indent=4)
    
    # print(json.dumps(result, indent=4))