require 'fileutils'

# Path to the input file
if ARGV.length != 1
  puts "Usage: ruby kkt.rb <input_file_path>"
  exit
end

# Path to the input file
input_file_path = ARGV[0]

# Directory to save the new markdown files
output_dir = '/Users/ripley/Sites/leksiko/_newfiles'
FileUtils.mkdir_p(output_dir)

# Extract the category from the input file name (without extension) and set it to lowercase
category = File.basename(input_file_path, File.extname(input_file_path)).downcase

# Read the input file
File.readlines(input_file_path).each do |line|
  next if line.strip.empty?

  # Split the line into title and content
  title, content = line.split(':', 2)
  next unless title && content

  puts title, content

  # Extract and remove the mallongigo part if present
  mallongigo = nil
  if content.include?('(') && content.include?(')')
    mallongigo = content[/\((mallonge(.*?))\)/, 1]
    content = content.gsub(/\s*\(.*?\):\s*/, '')
  end



  mallongigo = mallongigo.gsub('mallonge ', '') if mallongigo
  mallongigo = mallongigo.gsub('.', '') if mallongigo

  # Clean up the title and content
  title = title.strip.downcase
  content = content.strip

   # if title ends with *, remove it and add it to the metadata with the key 'neologismo' set to 'true'
  if title.end_with?('*')
    title = title[0..-2]
    neologismo = true
  end

  #get first phrase of content for the description
  description = content.split('.').first

  # escape quotes in description
  description = description.gsub('"', '\"')
  description = description.gsub("'", "\'")

  # Create a new markdown file with the title as the name
  output_file_path = File.join(output_dir, "#{title.downcase.gsub(' ', '_')}.md")
  File.open(output_file_path, 'w') do |file|
    file.puts "---"
    file.puts "title: #{title}"
    file.puts "layout: post"
    file.puts "neologismo: #{neologismo}" if neologismo
    file.puts "description: \"#{description}\""
    file.puts "mallongigo: #{mallongigo}" if mallongigo
    file.puts "category: #{category}"
    file.puts "---"
    file.puts "## Difino\n\n"
    file.puts content
  end

  puts "Created #{output_file_path}"
end

puts "All files created in #{output_dir}"
