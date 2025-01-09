require 'json'
require 'yaml'
require 'fileutils'

# Directory containing markdown files
docs_dir = '_docs'

# Get all markdown files in the directory
md_files = Dir.glob(File.join(docs_dir, '*.md'))

# Array to hold all JSON data
all_json_data = []

md_files.each do |file_path|
  # Read the markdown file
  file_content = File.read(file_path)

  # Split the content into front matter and body
  front_matter, body = file_content.split('---', 3)[1..2]

  # Parse the front matter as YAML
  metadata = YAML.load(front_matter)

  content = {}

  # set content to body and strip leading and trailing whitespace
  content = body.strip

  # Extract sections
  sections = {}
  current_section = nil
  body.each_line do |line|
    if line.start_with?('## ')
      current_section = line.strip[3..]
      sections[current_section] = ''
    elsif current_section
      sections[current_section] += line
    end
  end

  # Remove leading and trailing newlines from sections
  sections.each do |key, value|
    sections[key] = value.strip
  end

  # Extract 'Aliaj Lingvoj' section
  languages = {}
  if sections['Aliaj Lingvoj']
    content = content.gsub(/## Aliaj Lingvoj.*$/, '')
    sections['Aliaj Lingvoj'].strip.split("\n").each do |line|
      next unless line.start_with?('- ')
      lang, translation = line[2..].split(':').map(&:strip)
      languages[lang] = translation
      content = content.gsub(/#{Regexp.escape(line)}/, '')
    end
    sections.delete('Aliaj Lingvoj')
    #add language to metadata
    metadata['languages'] = languages
  end

  # Extract 'Referencoj' section
  references = []
  if sections['Referencoj']
    content = content.gsub(/## Referencoj.*$/, '')
    sections['Referencoj'].strip.split("\n").each do |line|
      next unless line.start_with?('* ')
      if line.match(/\[(.*?)\]\((.*?)\)/)
        title = line.match(/\[(.*?)\]/)[1]
        url = line.match(/\((.*?)\)/)[1]
        references << { title: title, url: url }
        content = content.gsub(/#{Regexp.escape(line)}/, '')
      else
        puts "Skipping invalid reference line: #{line}"
      end
    end
    sections.delete('Referencoj')
    #delete the matching part of the content

    #add references to metadata
    metadata['references'] = references
  end

  # Check for duplicates and store them in separate variables
  duplicate_entries = all_json_data.select { |entry| entry[:metadata]['title'] == metadata['title'] }
  if duplicate_entries.any?
    duplicate_entries.each do |duplicate_entry|
      puts "Duplicate entry found: #{metadata['title']}"
      puts "Storing duplicate entries..."
      # Store duplicates in separate variables
      duplicate_1 = duplicate_entry
      duplicate_2 = { metadata: metadata, content: content }
      # Remove both duplicates from the array
      all_json_data.delete(duplicate_entry)
      # merge the duplicates, taking care that 'languages' and 'references' may have different values for each key. in that case, keep both values
      if duplicate_2[:metadata]
        duplicate_1[:metadata].merge!(duplicate_2[:metadata]) do |key, oldval, newval|
          if key == 'references'
            oldval.is_a?(Array) ? (oldval + newval).uniq : oldval.merge(newval) { |_, oldv, newv| oldv == newv ? oldv : [oldv, newv].flatten.uniq }
          elsif key == 'languages'
            merged_languages = {}
              [duplicate_1[:metadata]['languages'], duplicate_2[:metadata]['languages']].each do |languages|
                languages.each do |language|
                  language.each do |key, values|
                    merged_languages[key] ||= []
                    merged_languages[key].concat(values).uniq!
                  end
                end
              end
              puts merged_languages
              duplicate_1[:metadata]['languages'] = merged_languages
          else
            newval
          end
        end
      end




      duplicate_1[:content] = duplicate_1[:content] + "\n\n" + duplicate_2[:content]
      # Add the merged entry back to the array
      all_json_data << duplicate_1
    end
  else
    # Prepare the JSON structure
    json_data = {
      metadata: metadata,
      content: content
    }
    # Add the JSON data to the array
    all_json_data << json_data if metadata
  end

  puts "Processed #{file_path}"
end

# Write all JSON data to a single file
output_file_path = 'leksiko_md.json'
File.open(output_file_path, 'w') do |file|
  file.write(JSON.pretty_generate(all_json_data))
end

puts "All data saved to #{output_file_path}"
