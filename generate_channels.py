import xml.etree.ElementTree as ET
import os

def collect_unique_channels(base_dir, target_dirs):
    unique_channels = {}
    
    target_dirs = [os.path.join(base_dir, d) for d in target_dirs]
    
    for dirpath, _, filenames in os.walk(base_dir):
        if any(dirpath.startswith(target_dir) for target_dir in target_dirs):
            for filename in filenames:
                if filename.endswith('.xml'):
                    input_file = os.path.join(dirpath, filename)
                    print(f'Processing {input_file}...')
                    
                    tree = ET.parse(input_file)
                    root = tree.getroot()
                    
                    for channel in root.findall('channel'):
                        xmltv_id = channel.get('xmltv_id')
                        
                        if xmltv_id and xmltv_id not in unique_channels:
                            unique_channels[xmltv_id] = channel
    
    return unique_channels

def save_unique_channels(unique_channels, output_file):
    filtered_root = ET.Element('channels')
    
    for channel in unique_channels.values():
        filtered_root.append(channel)
    
    filtered_tree = ET.ElementTree(filtered_root)
    filtered_tree.write(output_file, encoding='utf-8', xml_declaration=True)

base_directory = 'sites'
output_file = 'updated_channels.xml'
target_dirs = ['tvpassport.com']

unique_channels = collect_unique_channels(base_directory, target_dirs)
save_unique_channels(unique_channels, output_file)
