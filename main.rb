$:.unshift File.join('lib/ruby')

require 'rubygems'
require 'jdbc/sqlite3'
require 'sequel'
require 'sinatra'
require 'yaml'
require 'pp'
require 'json'
require 'timeout'

require 'java'
require 'lib/java/jaudiotagger-2.0.2.jar'
require 'lib/java/sqlitejdbc-3.6.3.054.jar'
import 'org.sqlite.JDBC' 

require 'src/utils'
require 'src/library'
include Utils, Library

# check environment
if File.exists? 'config.yml'
  config = YAML::load( File.open('config.yml') )
  config['location'] += '/'
else
  puts "config.yml not found. Exiting."
  exit -1
end

$db = Sequel.connect('jdbc:sqlite:library.sqlite')

class Song
  def to_json
    to_s.to_json
  end
end
class Sequel::Dataset
  def to_json
    naked.all.to_json
  end
end
class Sequel::Model
  def self.to_json
    dataset.to_json
  end
end

def list_by_path(path)
  $db[:songs].filter(:path => path).order('folder DESC, id3_track, file')
end

# library generation
if !$db.table_exists?(:songs) or !config['skip_discovery']
  puts "Table not found, creating and forcing library discovery" if !$db.table_exists?(:songs)
  FileUtils.mkdir('art') if !File.directory?('art')
  $db.create_table! :songs do
    primary_key :id
    String :path, :null => false
    String :file, :null => false
    boolean :folder, :default => false
    integer :length
    String :art
    integer :id3_track
    String :id3_artist
    String :id3_album
    String :id3_title
    String :id3_date
  end
  Library::scan(config['location'])
end

Thread.new { Library::scan_album_art(config['location']) }

# =============
#  main routes
# =============
get '/' do
  send_file 'public/index.html'
end

get '/list/?*/?' do
  Timeout.timeout(10) do
    path = Utils::sanitize params[:splat].join('')   
    redirect('/#'+path) if !request.xhr?
    files = list_by_path(path)
    
    Utils::trim_response(files.to_json).to_json
  end
end

get '/browse/?' do
  Timeout.timeout(10) do
    whereartist = (!params[:artist].to_s.empty?) ? 'WHERE id3_artist = :artist ' : ''
    
    artists = Song.find_by_sql('SELECT DISTINCT id3_artist FROM songs ORDER BY id3_artist').map(&:id3_artist)
    albums = Song.find_by_sql([ 'SELECT DISTINCT id3_album FROM songs ' + whereartist + 'ORDER BY id3_album', {:artist => params[:artist]} ]).map(&:id3_album)
    songs = []
    if ( !params[:artist].to_s.empty? || !params[:album].to_s.empty? )
      cond = {}
      cond[:id3_artist] = params[:artist] if !params[:artist].to_s.empty?
      cond[:id3_album] = params[:album] if !params[:album].to_s.empty?
      songs = Song.find(:all, :select => 'id, id3_title', :conditions => cond, :order => 'folder, id3_track, file ')
    end
    
    { :artists => artists, :albums => albums, :songs => songs }.to_json;
  end
end

get '/get/:id' do |n|
  # find song, and just send the file
  Timeout.timeout(10) do
    f = $db[:songs].filter(:id => params[:id]).first()
    filepath = config['location'] + f[:path] + '/' + f[:file]
    send_file filepath, :filename => f[:file]
  end
end

get '/pic/:id' do |n|
  Timeout.timeout(10) do
    f = $db[:songs].filter(:id => params[:id]).first()
    return false if f[:art] == 'f'
    send_file "art/#{f[:art]}"
  end
end

get '/*' do
  redirect '/#'+params[:splat][0]
end
