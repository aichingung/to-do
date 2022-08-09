let items = document.querySelectorAll('.item')


document.documentElement.style.setProperty('--animate-duration', '2s');

function handleClick(event) {
  
  let theListItemThatTheUserClickedOn = event.target
  
  theListItemThatTheUserClickedOn.classList.toggle('completed')
}

for (let i = 0; i <items.length; i++) {
  items[i].addEventListener('click', handleClick)
}