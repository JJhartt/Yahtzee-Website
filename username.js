document.getElementById('usernameForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const usernameInput = document.getElementById('usernameInput');
  const username = usernameInput.value.trim();
  
  if (username) {
    sessionStorage.setItem('gameUsername', username);
    window.location.href = 'index.html';
  } 
});