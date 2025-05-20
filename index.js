$(document).ready(async function () {
  let firstCard = null,
    secondCard = null,
    boardLocked = false,
    moves = 0,
    pairsFound = 0,
    totalPairs = 0,
    timerInterval = null,
    timeLeft = 0,
    allPokemonCards = [];

  function shuffleCards(numCards) {
    for (let i = numCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numCards[i], numCards[j]] = [numCards[j], numCards[i]];
    }
    return numCards;
  }

  function updateCardStatus() {
    $('#moves').text(`Moves: ${moves}`);
    $('#pairsLeft').text(`Pairs Left: ${totalPairs - pairsFound}`);
    $('#timer').text(`Time: ${timeLeft}`);
  }

  function setupCards() {
    $('.card').on('click', function () {
      if (boardLocked) return;
      if ($(this).hasClass('flipped')) return;

      $(this).addClass('flipped');
      if (!firstCard) {
        firstCard = $(this);
        return;
      }

      secondCard = $(this);
      boardLocked = true;
      moves++;
      updateCardStatus();
      checkIfCardsMatch();
    });
  }

  function checkIfCardsMatch() {
    const img1 = firstCard.find('.front_face')[0].src;
    const img2 = secondCard.find('.front_face')[0].src;

    if (img1 === img2) {
      firstCard.add(secondCard)
        .addClass('matched')
        .off('click');
      pairsFound++;
      resetTurn();
      updateCardStatus();
      if (pairsFound === totalPairs) endGame(true);
    } else {
      setTimeout(() => {
        firstCard.removeClass('flipped');
        secondCard.removeClass('flipped');
        resetTurn();
      }, 1000);
    }
  }

  function resetTurn() {
    [firstCard, secondCard] = [null, null];
    boardLocked = false;
  }

  function startGameTimer(duration) {
    clearInterval(timerInterval);
    timeLeft = duration;
    updateCardStatus();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateCardStatus();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }

  function endGame(gameStatus) {
    clearInterval(timerInterval);
    boardLocked = true;
    $('.card').off('click');
    $('#gameMessage')
      .removeClass('win lose')
      .addClass(gameStatus ? 'win' : 'lose')
      .text(gameStatus ? 'You win!' : 'Time’s up!');
  }


  async function startGame() {
    clearInterval(timerInterval);
    moves = pairsFound = 0;
    firstCard = secondCard = null;
    boardLocked = false;

    const difficulty = $('#difficulty').val();
    let pairs, timeLimit;
    if (difficulty === 'easy') [pairs, timeLimit] = [3, 60];
    else if (difficulty === 'medium') [pairs, timeLimit] = [6, 90];
    else[pairs, timeLimit] = [9, 120];

    totalPairs = pairs;
    await generateGameBoard(pairs);
    updateCardStatus();
    setupCards();
    startGameTimer(timeLimit);
    $('#gameMessage').empty();
  }

  function resetGameBoard() {
    clearInterval(timerInterval);
    $('#game_grid').empty();
    moves = pairsFound = 0;
    updateCardStatus();
    $('#timer').text('Time: 0');
    $('#gameMessage').empty();
  }

  function toggleTheme() {
    const next = $('body').attr('data-theme') === 'dark' ? 'light' : 'dark';
    $('body').attr('data-theme', next);
    $('#theme-toggle').text(next === 'dark' ? 'Light Mode' : 'Dark Mode');
  }

  function revealAllCards() {
    if (boardLocked) return;
    boardLocked = true;
    $('.card:not(.flipped)').addClass('flipped');
    setTimeout(() => {
      $('.card:not(.matched)').removeClass('flipped');
      boardLocked = false;
    }, 1500);
  }

  async function getAllPokemon() {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
    const data = await res.json();
    allPokemonCards = data.results.filter(poke => {
      const match = poke.url.match(/\/pokemon\/(\d+)\//);
      if (!match) return false;
      const id = parseInt(match[1], 10);
      return id <= 1025;
    });
  }

  function generateRandomPokemon(numCardsRequired) {
    const copy = allPokemonCards.slice();
    const picked = [];
    for (let i = 0; i < numCardsRequired; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  }

  async function getPokemonArtwork(pokemon) {
    const res = await fetch(pokemon.url);
    const data = await res.json();
    return (
      data.sprites.other['official-artwork'].front_default ||
      data.sprites.front_default ||
      'https://via.placeholder.com/120x168?text=No+Image'
    );
  }

  async function generateGameBoard(pairCount) {
    const picks = generateRandomPokemon(pairCount);
    const officialArt = await Promise.all(picks.map(getPokemonArtwork));
    const deck = shuffleCards(officialArt.concat(officialArt));

    $('#game_grid')
      .empty()
      .removeClass('easy medium hard')
      .addClass($('#difficulty').val());

    deck.forEach(src => {
      const $card = $('<div>').addClass('card');
      $('<img>').addClass('front_face').attr('src', src).appendTo($card);
      $('<img>').addClass('back_face').attr('src', 'BackOfCard.png').appendTo($card);
      $('#game_grid').append($card);
    });
  }

  await getAllPokemon();
  updateCardStatus();

  $('#start').on('click', startGame);
  $('#reset').on('click', resetGameBoard);
  $('#theme-toggle').on('click', toggleTheme);
  $('#peek').on('click', revealAllCards);

});
