const Modal = {
  toggle() {
    Form.clearFields();
    document
    .querySelector('.modal-overlay')
    .classList.toggle('active');
  },
  toggleClearModal() {
    document
    .querySelector('.modal-overlay-clear')
    .classList.toggle('active');
  },
  
  outsideClick(event, modal) {
    const modalOverlay = document.querySelector(modal);

    if (!modalOverlay.contains(event.target)) {
      if (modal === '.modal') {
        Modal.toggle();
      }
      if (modal === '.modal-clear') {
        Modal.toggleClearModal();
      }
    }
    
    /*
    // With BoundingClientRect
    const clickX = event.clientX;
    const clickY = event.clientY;

    if (modal === '.modal') {
      const top = document.querySelector('.modal').getBoundingClientRect().top;
      const right = document.querySelector('.modal').getBoundingClientRect().right;
      const bottom = document.querySelector('.modal').getBoundingClientRect().bottom;
      const left = document.querySelector('.modal').getBoundingClientRect().left;
  
      if (clickX > right || clickX < left || clickY < top || clickY > bottom) {
        Modal.toggle();
      }
    }

    if (modal === '.modal-clear') {
      const top = document.querySelector('.modal-clear').getBoundingClientRect().top;
      const right = document.querySelector('.modal-clear').getBoundingClientRect().right;
      const bottom = document.querySelector('.modal-clear').getBoundingClientRect().bottom;
      const left = document.querySelector('.modal-clear').getBoundingClientRect().left;
  
      if (clickX > right || clickX < left || clickY < top || clickY > bottom) {
        Modal.toggleClearModal();
      }
    }*/
  }
}

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
  },

  set(transactions) {
    localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions));
  }
}

const Transaction = {
  all: Storage.get(),

  add(transaction) {
    Transaction.all.push(transaction);

    App.reload();
  },

  removeAll() {
    Transaction.all = [];
    App.reload();
    Modal.toggleClearModal();
  },

  remove(event) {
    event.preventDefault();
    const index = event.currentTarget.parentNode.parentNode.dataset.index;
    AnimationTable.animaFadeOutLeft(event.currentTarget.parentNode.parentNode);
    
    setTimeout(() => {
      Transaction.all.splice(index, 1);
      App.reload();
    }, 1000);
  },

  incomes() {
    let income = 0;
    Transaction.all.forEach((transaction) => {
      if(transaction.amount > 0) {
        income += transaction.amount;
      }
    })
    return income;
  },

  expenses() {
    let expense = 0;
    Transaction.all.forEach((transaction) => {
      if(transaction.amount < 0) {
        expense += transaction.amount;
      }
    })
    return expense;
  },

  total() {
    return Transaction.incomes() + Transaction.expenses();
  }
}

const DOM = {
  transactionsContainer: document.querySelector('#data-table tbody'),

  addTransaction(transaction, index, filter) {
    const tr = document.createElement('tr');
    AnimationTable.animaFadeInUp(tr);
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index, filter);
    if(tr.innerHTML !== "") {
      tr.dataset.index = index;
      tr.querySelector('[data-remove]').addEventListener('click', Transaction.remove);
      DOM.transactionsContainer.appendChild(tr);
    }
  },

  innerHTMLTransaction(transaction, index, filter) {
    let html = "";
    if(filter === "income" && transaction.amount > 0) {
      const CSSClass = "income";
      const amount = Utils.formatCurrency(transaction.amount);
      html = DOM.createHTMLTransactions(transaction, CSSClass, amount);

    } else if (filter === "expense" && transaction.amount < 0) {
      const CSSClass = "expense";
      const amount = Utils.formatCurrency(transaction.amount);
      html = DOM.createHTMLTransactions(transaction, CSSClass, amount);

    } else if (filter === "all") {
      const CSSClass = transaction.amount > 0 ? "income" : "expense";
      const amount = Utils.formatCurrency(transaction.amount);
      html = DOM.createHTMLTransactions(transaction, CSSClass, amount);
    }
    // onclick="Transaction.remove(${index})"
    return html;
  },

  createHTMLTransactions(transaction, CSSClass, amount) {
    const html = `
    <tr>
      <td class="description">${transaction.description}</td>
      <td class="${CSSClass}">${amount}</td>
      <td class="date">${transaction.date}</td>
      <td>
        <a href="#" data-remove><img src="./assets/minus.svg" alt="Remover transação"></a>
      </td>
    </tr>
    `
    return html;
  },

  updateBalance() {
    document
      .getElementById('incomeDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.incomes());
    
    document
      .getElementById('expenseDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.expenses());
    
    document
      .getElementById('totalDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.total());

    document
      .querySelector('.card.total')
      .classList.remove('negative-total');
    
    if(Transaction.total() < 0) {
      document
        .querySelector('.card.total')
        .classList.add('negative-total');
    }
  },

  filterTransactions(event, filter) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(button => button.classList.remove('active'));
    event.currentTarget.classList.add('active');
    DOM.clearTransactions();
    Transaction.all.forEach((transaction, index) => DOM.addTransaction(transaction, index, filter));
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = "";
  }
}

const Utils = {
  formatAmount(value) {
    // O input [type=number] já entrega o campo em formato de número
    // value = Number(value.replace(/\,\./g, "")) * 100;
    value = value * 100;
    return Math.round(value);
  },

  formatDate(date) {
    const splittedDate = date.split("-");
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
  },

  formatCurrency(value) {
    const signal = Number(value) < 0 ? "-" : "";

    value = String(value).replace(/\D/g, "");

    value = Number(value) / 100;

    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return signal + value;
  }
}

const Form = {
  description: document.querySelector("input#description"),
  amount: document.querySelector("input#amount"),
  date: document.querySelector("input#date"),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value
    }
  },

  validateFields() {
    const { description, amount, date } = Form.getValues();

    if( description.trim() === "" ||
        amount.trim() === "" ||
        date.trim() === "" ) {
          throw new Error("Por favor, preencha todos os campos")
    }
  },

  formatValues() {
    let { description, amount, date} = Form.getValues();

    amount = Utils.formatAmount(amount);

    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date
    }
  },

  clearFields() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },

  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      Transaction.add(transaction);
      Form.clearFields();
      Modal.toggle();
    } catch(error) {
      alert(error.message);
    }
  }

}

const AnimationTable = {
  animaFadeInUp(element) {
    element.classList.add('animaFadeInUp');
  },

  animaFadeOutLeft(element) {
    element.classList.add('animaFadeOutLeft');
  }
}

const App = {
  init() {
    Transaction.all.forEach((transaction, index) => DOM.addTransaction(transaction, index, 'all'));

    DOM.updateBalance();

    Storage.set(Transaction.all)
  },

  reload() {
    DOM.clearTransactions();
    App.init();
  }
}

App.init();
