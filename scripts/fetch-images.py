#!/usr/bin/env python3
"""
Fetch Unsplash images for a batch of countries and update countries.ts
Usage: python3 scripts/fetch-images.py
"""

import urllib.request
import json
import re
import time

API_KEY = 'K1xU3xdUuw_p3eMEd7ox7Q02UimWAtOvuCU0-aCjEzM'
COUNTRIES_FILE = 'src/data/countries.ts'

# 45 countries: id -> display name for search query
BATCH = {
    '320': 'Guatemala',
    '340': 'Honduras',
    '222': 'El Salvador',
    '558': 'Nicaragua',
    '214': 'Dominican Republic',
    '332': 'Haiti',
    '328': 'Guyana',
    '740': 'Suriname',
    '084': 'Belize',
    '044': 'Bahamas',
    '780': 'Trinidad and Tobago',
    '554': 'New Zealand',
    '598': 'Papua New Guinea',
    '388': 'Jamaica',
}

def fetch_images(country_name):
    query = f'{country_name} food'.replace(' ', '+')
    url = f'https://api.unsplash.com/search/photos?query={query}&per_page=25&client_id={API_KEY}'
    req = urllib.request.Request(url, headers={'Accept-Version': 'v1'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    results = []
    for r in data.get('results', []):
        img_url = r['urls']['regular']
        alt = r.get('alt_description') or r.get('description') or f'{country_name} food'
        results.append({'url': img_url, 'alt': alt})
    return results

def images_to_ts(images):
    lines = []
    for img in images:
        alt = img['alt'].replace("'", "\\'") if img['alt'] else ''
        lines.append(f"      {{ url: '{img['url']}', alt: '{alt}' }}")
    return 'images: [\n' + ',\n'.join(lines) + '\n    ]'

def update_country(content, country_id, images):
    ts_block = images_to_ts(images)
    # Replace the images: [...] block inside this country's entry
    # Match from the country id declaration to find the right block
    pattern = rf"(  '{re.escape(country_id)}':.*?images:\s*\[)[^\]]*\]"
    replacement = rf'\1' + '\n' + ',\n'.join(
        f"      {{ url: '{img['url']}', alt: '{(img['alt'] or '').replace(chr(39), chr(92)+chr(39))}' }}"
        for img in images
    ) + '\n    ]'
    new_content, n = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if n == 0:
        print(f'  WARNING: could not find images block for {country_id}')
    return new_content

with open(COUNTRIES_FILE, 'r') as f:
    content = f.read()

total = len(BATCH)
for i, (country_id, country_name) in enumerate(BATCH.items(), 1):
    print(f'[{i}/{total}] {country_name} ({country_id})...', end=' ', flush=True)
    try:
        images = fetch_images(country_name)
        content = update_country(content, country_id, images)
        print(f'✓ {len(images)} images')
    except Exception as e:
        print(f'✗ {e}')
    time.sleep(0.5)  # gentle rate limiting

with open(COUNTRIES_FILE, 'w') as f:
    f.write(content)

print(f'\nDone. Updated {COUNTRIES_FILE}')
