require 'json'
require 'yaml'
require 'fileutils'

# Path to the JSON file
json_file_path = 'leksiko_md.json'

# Read the JSON file
json_data = JSON.parse(File.read(json_file_path))

# Merge duplicates based on title
json_data = json_data.group_by { |entry| entry['metadata']['title'] }.map { |_, entries| entries.reduce(&:merge) }



# Directory to save the markdown files
output_dir = '_docs_recreated'
FileUtils.mkdir_p(output_dir)

json_data.each do |entry|
  metadata = entry['metadata']
  body_content = entry['content']

  # Create the front matter
  front_matter = metadata.to_yaml

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
