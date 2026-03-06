        let artists = [];
        let songs = [];
        let playlists = [];
        let currentPlaylist = [];
        let currentTrackIndex = 0;
        let isPlaying = false;
        let currentUser = null;

        // Authentication check on page load
        function checkAuth() {
            const user = localStorage.getItem('soundwave_current');
            if (!user) {
                alert('Please login first');
                window.location.href = '../login/login-signin.html';
                return false;
            }
            currentUser = user;
            displayUserInfo();
            return true;
        }

        // Display user information
        function displayUserInfo() {
            const userDisplay = document.getElementById('userDisplay');
            if (currentUser) {
                const accounts = JSON.parse(localStorage.getItem('soundwave_accounts')) || [];
                const user = accounts.find(a => a.email === currentUser);
                if (user) {
                    userDisplay.textContent = user.name;
                }
            }
        }

        // Logout function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('soundwave_current');
                window.location.href = '../login/login-signin.html';
            }
        }

        // Load from localStorage (per user)
        function loadData() {
            const userKey = `musicAppData_${currentUser}`;
            const saved = localStorage.getItem(userKey);
            if (saved) {
                const data = JSON.parse(saved);
                artists = data.artists || [];
                songs = data.songs || [];
                playlists = data.playlists || [];
            }
            renderAll();
        }

        // Save to localStorage (per user)
        function saveData() {
            const userKey = `musicAppData_${currentUser}`;
            localStorage.setItem(userKey, JSON.stringify({ artists, songs, playlists }));
        }

        function addArtist() {
            const input = document.getElementById('artistInput');
            if (input.value.trim()) {
                artists.push(input.value.trim());
                input.value = '';
                saveData();
                renderArtists();
            }
        }

        function addSong() {
            const title = document.getElementById('songTitle');
            const artist = document.getElementById('songArtist');
            if (title.value.trim() && artist.value.trim()) {
                songs.push({ title: title.value.trim(), artist: artist.value.trim() });
                title.value = '';
                artist.value = '';
                saveData();
                renderSongs();
            }
        }

        function createPlaylist() {
            const input = document.getElementById('playlistName');
            if (input.value.trim()) {
                playlists.push({ name: input.value.trim(), songs: [...currentPlaylist] });
                input.value = '';
                saveData();
                renderPlaylists();
            }
        }

        function saveCurrentPlaylist() {
            if (currentPlaylist.length === 0) {
                alert('Add songs to your playlist first!');
                return;
            }
            const name = prompt('Playlist name:');
            if (name && name.trim()) {
                playlists.push({ name: name.trim(), songs: [...currentPlaylist] });
                saveData();
                renderPlaylists();
            }
        }

        function addSongToPlaylist(index) {
            if (!currentPlaylist.find(s => s.title === songs[index].title && s.artist === songs[index].artist)) {
                currentPlaylist.push(songs[index]);
                renderCurrentPlaylist();
            }
        }

        function removeSongFromPlaylist(index) {
            currentPlaylist.splice(index, 1);
            renderCurrentPlaylist();
        }

        function loadPlaylist(index) {
            currentPlaylist = [...playlists[index].songs];
            currentTrackIndex = 0;
            renderCurrentPlaylist();
            updateNowPlaying();
        }

        function clearPlaylist() {
            currentPlaylist = [];
            currentTrackIndex = 0;
            isPlaying = false;
            renderCurrentPlaylist();
            updateNowPlaying();
        }

        function playSong(index) {
            currentTrackIndex = index;
            isPlaying = true;
            updateNowPlaying();
        }

        function togglePlay() {
            if (currentPlaylist.length === 0) {
                alert('Add songs to your playlist first!');
                return;
            }
            isPlaying = !isPlaying;
            updateNowPlaying();
        }

        function nextTrack() {
            if (currentPlaylist.length === 0) return;
            currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
            updateNowPlaying();
        }

        function previousTrack() {
            if (currentPlaylist.length === 0) return;
            currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
            updateNowPlaying();
        }

        function updateNowPlaying() {
            const playBtn = document.getElementById('playBtn');
            if (currentPlaylist.length === 0) {
                document.getElementById('trackTitle').textContent = 'No Song Playing';
                document.getElementById('trackArtist').textContent = 'Select a song to play';
                playBtn.textContent = '▶ Play';
                return;
            }
            const track = currentPlaylist[currentTrackIndex];
            document.getElementById('trackTitle').textContent = track.title;
            document.getElementById('trackArtist').textContent = track.artist;
            playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        }

        function renderArtists() {
            const list = document.getElementById('artistList');
            if (artists.length === 0) {
                list.innerHTML = '<div class="empty-state">No artists added yet</div>';
                return;
            }
            list.innerHTML = artists.map((artist, i) => 
                `<div class="artist-item">${artist}</div>`
            ).join('');
        }

        function renderSongs() {
            const list = document.getElementById('songList');
            if (songs.length === 0) {
                list.innerHTML = '<div class="empty-state">No songs added yet</div>';
                return;
            }
            list.innerHTML = songs.map((song, i) => 
                `<div class="song-item" onclick="addSongToPlaylist(${i})">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>`
            ).join('');
        }

        function renderPlaylists() {
            const list = document.getElementById('playlistsList');
            if (playlists.length === 0) {
                list.innerHTML = '<div class="empty-state">No playlists created yet</div>';
                return;
            }
            list.innerHTML = playlists.map((playlist, i) => 
                `<div class="playlist-item" onclick="loadPlaylist(${i})">
                    ${playlist.name}
                    <span class="badge">${playlist.songs.length} songs</span>
                </div>`
            ).join('');
        }

        function renderCurrentPlaylist() {
            const display = document.getElementById('currentPlaylist');
            if (currentPlaylist.length === 0) {
                display.innerHTML = '<div class="empty-state">Add songs to create a playlist</div>';
                return;
            }
            display.innerHTML = currentPlaylist.map((song, i) => 
                `<div class="playlist-item">
                    <div style="flex: 1;">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist}</div>
                    </div>
                    <button style="width: auto; padding: 5px 10px; font-size: 0.8em;" onclick="removeSongFromPlaylist(${i})">✕</button>
                </div>`
            ).join('');
        }

        function renderAll() {
            renderArtists();
            renderSongs();
            renderPlaylists();
            renderCurrentPlaylist();
            updateNowPlaying();
        }

        // Page Navigation
        function switchPage(page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            
            if (page === 'player') {
                document.getElementById('playerPage').classList.add('active');
                document.querySelectorAll('.tab-btn')[0].classList.add('active');
            } else if (page === 'upload') {
                document.getElementById('uploadPage').classList.add('active');
                document.querySelectorAll('.tab-btn')[1].classList.add('active');
                populatePlaylistSelect();
            }
        }

        // Populate playlist select dropdown
        function populatePlaylistSelect() {
            const select = document.getElementById('playlistSelect');
            select.innerHTML = '<option value="">-- Choose a playlist --</option>';
            playlists.forEach((playlist, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = playlist.name + ` (${playlist.songs.length} songs)`;
                select.appendChild(option);
            });
        }

        let selectedFiles = [];

        function handleFileSelect() {
            const input = document.getElementById('audioFiles');
            selectedFiles = Array.from(input.files);
            renderFilePreview();
        }

        function renderFilePreview() {
            const preview = document.getElementById('filePreview');
            if (selectedFiles.length === 0) {
                preview.innerHTML = '<div class="empty-state">No files selected</div>';
                return;
            }
            preview.innerHTML = selectedFiles.map((file, i) => 
                `<div class="song-item">
                    <div class="song-title">🎵 ${file.name}</div>
                    <div class="song-artist">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>`
            ).join('');
        }

        function clearFileSelection() {
            selectedFiles = [];
            document.getElementById('audioFiles').value = '';
            renderFilePreview();
        }

        function uploadSongsToPlaylist() {
            const playlistIndex = document.getElementById('playlistSelect').value;
            
            if (playlistIndex === '') {
                alert('Please select a playlist');
                return;
            }
            
            if (selectedFiles.length === 0) {
                alert('Please select audio files from the music folder');
                return;
            }

            selectedFiles.forEach(file => {
                const songName = file.name.replace(/\.[^/.]+$/, '');
                const [title, artist] = songName.includes('-') 
                    ? songName.split('-').map(s => s.trim()) 
                    : [songName, 'Unknown Artist'];
                
                playlists[playlistIndex].songs.push({ 
                    title, 
                    artist, 
                    path: `Music`
                });
            });

            saveData();
            clearFileSelection();
            alert(`Added ${selectedFiles.length} song(s) to "${playlists[playlistIndex].name}"`);
            populatePlaylistSelect();
        }

        // Initialize
        if (checkAuth()) {
            loadData();
        }