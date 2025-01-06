require 'json'
require 'yaml'
require 'fileutils'

# Path to the JSON file
json_file_path = '/Users/ripley/Sites/leksiko/leksiko_md.json'

# Read the JSON file
json_data = JSON.parse(File.read(json_file_path))

# Directory to save the markdown files
output_dir = '/Users/ripley/Sites/leksiko/_docs_recreated'
FileUtils.mkdir_p(output_dir)

json_data.each do |entry|
  metadata = entry['metadata']
  sections = entry['sections']
  languages = entry['languages']
  references = entry['references']

  # Create the front matter
  front_matter = metadata.to_yaml

  # Create the body content
  body_content = ""
  sections.each do |section, content|
    body_content += "## #{section}\n\n#{content.strip}\n\n"
  end

  # Add 'Aliaj Lingvoj' section
  if languages.any?
    body_content += "## Aliaj Lingvoj\n\n"
    languages.each do |lang, translation|
      body_content += "- #{lang}: #{translation}\n"
    end
    body_content += "\n"
  end

  # Add 'Referencoj' section
  if references.any?
    body_content += "## Referencoj\n\n"
    references.each do |reference|
      body_content += "* [#{reference['title']}](#{reference['url']})\n"
    end
    body_content += "\n"
  end

  # Combine front matter and body content
  markdown_content = "#{front_matter}---\n#{body_content.strip}\n"

  # Determine the output file path
  output_file_path = File.join(output_dir, "#{metadata['title'].downcase.gsub(' ', '_')}.md")

  # Write the markdown content to the file
  File.open(output_file_path, 'w') do |file|
    file.write(markdown_content)
  end

  puts "Recreated #{output_file_path}"
end

puts "All markdown files recreated in #{output_dir}"
