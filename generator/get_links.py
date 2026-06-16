# Let's try downloading the html text and parsing it using standard regex
import urllib.request
import re
import pandas as pd

# url = "https://docs.cycling74.com/userguide/gen/gen_common_operators/"
# url = "https://docs.cycling74.com/userguide/gen/gen~_operators/"
url = "https://docs.cycling74.com/userguide/gen/gen_jitter_operators/"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)

try:
    with urllib.request.urlopen(req) as response:
        html_content = response.read().decode('utf-8')
    
    # regex to find <a href="...">text</a>
    # Looking for links containing /reference/gen_common_ or dsp gen_jit_
    # matches = re.findall(r'<a[^>]+href="([^"]*/reference/gen_common_[^"]*)"[^>]*>(.*?)</a>', html_content)
    # matches = re.findall(r'<a[^>]+href="([^"]*/reference/gen_dsp_[^"]*)"[^>]*>(.*?)</a>', html_content)
    matches = re.findall(r'<a[^>]+href="([^"]*/reference/gen_jit_[^"]*)"[^>]*>(.*?)</a>', html_content)
    
    # Clean the tags inside text if any
    cleaned_matches = []
    for href, text in matches:
        text_clean = re.sub('<[^<]+?>', '', text).strip()
        cleaned_matches.append({'name': text_clean, 'href': href})
        
    df = pd.DataFrame(cleaned_matches).drop_duplicates().reset_index(drop=True)
    df.to_csv("gen_jit_operators_links.csv", index=False)
    print("CSV saved. Rows found:", len(df))
    print(df)
except Exception as e:
    print("Error:", e)