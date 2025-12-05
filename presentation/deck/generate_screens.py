import os
import re

# Read the main HTML file
with open('/Users/Morpheous/vltrndataroom/DotDesignPop_PowerBI_Project/presentation/DotDesignPop_Presentation.html', 'r') as f:
    html_content = f.read()

pages = [
    {'name': '01_Dashboard', 'tab': 'dashboard', 'url': 'https://app.powerbi.com/saintjames/coolers/dashboard'},
    {'name': '02_Warehouse', 'tab': 'warehouse', 'url': 'https://app.powerbi.com/saintjames/coolers/warehouse'},
    {'name': '03_Shipments', 'tab': 'shipments', 'url': 'https://app.powerbi.com/saintjames/coolers/shipments'},
    {'name': '04_Warranty', 'tab': 'warranty', 'url': 'https://app.powerbi.com/saintjames/coolers/warranty-service'},
]

deck_dir = '/Users/Morpheous/vltrndataroom/DotDesignPop_PowerBI_Project/presentation/deck'

for page in pages:
    modified = html_content
    
    # Update nav tabs - remove active from all, add to current
    modified = re.sub(r'class="nav-tab active"', 'class="nav-tab"', modified)
    modified = re.sub(
        rf'class="nav-tab" data-tab="{page["tab"]}"',
        f'class="nav-tab active" data-tab="{page["tab"]}"',
        modified
    )
    
    # Update pages - remove active from all, add to current
    modified = re.sub(r'class="page active"', 'class="page"', modified)
    modified = re.sub(
        rf'class="page" id="page-{page["tab"]}"',
        f'class="page active" id="page-{page["tab"]}"',
        modified
    )
    
    # Update URL display
    modified = re.sub(
        r'https://app\.powerbi\.com/saintjames/coolers/dashboard',
        page['url'],
        modified
    )
    
    # Write the modified HTML
    output_path = os.path.join(deck_dir, f'{page["name"]}.html')
    with open(output_path, 'w') as f:
        f.write(modified)
    
    print(f'Created: {output_path}')

print('Done creating HTML files!')
