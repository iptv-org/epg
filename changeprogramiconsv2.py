import xml.etree.ElementTree as ET

def update_icon_source(guide_file, programmes_file):
    # Parse the guide XML file (where we want to update the icon sources)
    guide_tree = ET.parse(guide_file)
    guide_root = guide_tree.getroot()

    # Parse the programmes XML file (metadata source)
    programmes_tree = ET.parse(programmes_file)
    programmes_root = programmes_tree.getroot()

    # Create a dictionary to map titles to image sources from programmes.xml
    title_to_image = {}
    for programme in programmes_root.findall('.//programme'):
        title = programme.find('title').text
        image = programme.find('icon').text
        if title and image:
            title_to_image[title] = image

    # Update the icon source in the guide XML file based on the title match
    for programme in guide_root.findall('.//programme'):
        title = programme.find('title').text
        if title in title_to_image:
            icon_element = programme.find('icon')
            if icon_element is None:
                icon_element = ET.SubElement(programme, 'icon')
            icon_element.set('src', title_to_image[title])

    # Save the updated guide XML file
    guide_tree.write('updated_guide.xml', encoding='utf-8', xml_declaration=True)

# Example usage
update_icon_source('guide.xml', 'programmes.xml')
