/* ====================== 共用常數資料 ====================== */
const GameState = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameEnd: 'GameEnd'
}

// 卡牌花色
const Symbols = [
  // suits icon
  '&spades;',
  '&clubs;',
  '&hearts;',
  '&diamondsuit;'
]

/* ====================== 變數 Model ====================== */
const model = {
  revealedCards: [],  // 代表「被翻開的卡片」，暫存進來

  // 利用 餘數 檢查使用者翻開的兩張卡片是否相同
  // 若相等就回傳 true，反之則為 false
  isRevealedCardsMatched() {
    return (this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13)
  },

  score: 0,
  triedTimes: 0

}


/* ====================== 介面 View ====================== */
const view = {

  // 生成牌背面 index = 0 ~ 51
  getCardElement(index) {
    // index = [26 ~ 51] 愛心方塊顯示紅色
    let redSuits = index > 25 ? 'red-card' : ''
    // 預設先顯示牌背 class 加入 .back
    return `<div class="card back ${redSuits}" data-index="${index}"></div>`
  },

  // 負責生成卡片內容，包括花色和數字
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]  // 0 ~ 12: Symbols[0] 、 13 ~ 25: Symbols[1]
    return `
        <p>${number}</p>
        <i class="suit-icon">${symbol}</i>
        <p>${number}</p>
    `
  },

  // 將數字 1, 11, 12, 13 轉換成 A, J, Q, K
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // 負責選出 #cards 並抽換內容
  displayCards(indexes) {
    const cardsElement = document.querySelector('#cards')
    cardsElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // 翻牌
  flipCard(...cards) {
    cards.map((card) => {
      // 如果現在顯示背面，回傳正面
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 如果現在顯示正面，回傳背面
      card.classList.add('back')
      card.innerHTML = null // 只顯示背面圖樣，清掉花色、數字
    })
  },

  // 改變成功配對的排的樣式
  pairCard(...cards) {
    cards.map((card) => {
      card.classList.add('paired')
      card.classList.remove('red-card')
    })
  },

  // 顯示分數
  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: <b>${score}</b>`;
  },

  // 顯示嘗試次數
  renderTriedTimes(times) {
    document.querySelector('.tried-times').innerHTML = `You've tried: <b>${times}</b> times`;
  },

  // 加入配對失敗動畫效果
  // 一旦跑完一輪，就移除動畫與監聽器，等下次再觸發
  // {once : true} 要求在事件執行一次之後，就要卸載這個監聽器
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event =>
        event.target.classList.remove('wrong')), { once: true }
    })
  },

  // 遊戲結束畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>CONGRATS!</p>
      <P>SCORE : ${model.score}</P>
      <p>YOU'VE TRIED :  ${model.triedTimes} TIMES</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

/* ====================== 外部函式庫 Utility ====================== */
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

/* ====================== 流程 Controller ====================== */
const controller = {

  currentState: GameState.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 依照當下的遊戲狀態，發派工作給 view 和 controller
  dispatchCardAction(card) {
    // 牌如果是翻開的狀態，終止函式
    if (!card.classList.contains('back')) return

    switch (this.currentState) {

      // 翻開第一張牌
      case GameState.FirstCardAwaits:
        view.flipCard(card)
        model.revealedCards.push(card)
        this.currentState = GameState.SecondCardAwaits
        break

      // 翻開第二張牌
      case GameState.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCard(card)
        model.revealedCards.push(card)
        console.log(model.isRevealedCardsMatched())

        // 如果 isRevealedCardsMatched() 得出布林值是 true
        // 代表配對成功
        if (model.isRevealedCardsMatched()) {
          view.renderScore(model.score += 10)
          this.currentState = GameState.CardsMatched
          view.pairCard(...model.revealedCards)  // 卡片在牌桌上維持翻開，改變卡片底色樣式
          model.revealedCards = []  // 清空暫存牌組
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GameState.GameEnd
            view.showGameFinished()
            return
          }
          this.currentState = GameState.FirstCardAwaits  // 動作結束後，遊戲狀態回到第一步
        }

        // 如果 isRevealedCardsMatched() 得出布林值是 false
        // 配對失敗
        // setTimeout 一秒後蓋起來
        else {
          this.currentState = GameState.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCard, 1000) // 延遲 1 秒讓使用者記憶卡片
        }
        break
    }
  },

  // 重置卡片狀態，回到第一步
  resetCard() {
    view.flipCard(...model.revealedCards)  // 翻回卡片
    model.revealedCards = []  // 清空暫存牌組
    controller.currentState = GameState.FirstCardAwaits  // 動作結束後，遊戲狀態回到第一步
  }
}


controller.generateCards()


// Node list (array-like) 不能用 map()，map() 是 array method
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})