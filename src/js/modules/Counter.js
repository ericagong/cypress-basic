export default function Counter({ $app }) {
  const MIN_COUNT = 8;
  const MAX_COUNT = 12;
  const INITIAL_COUNT = 10;

  const render = () => {
    $app.innerHTML = `
       <div class="container">
          <h1>ui counter</h1>
          <div class="counter">
            <button type="button" class="btn-dec" data-cy="decrease-button">-</button>
            <input name="count" type="text" class="count-display" data-cy="count-display" value="${INITIAL_COUNT}">
            <button type="button" class="btn-inc" data-cy="increase-button">+</button>
          </div>
        </div>`;
  };

  const init = () => {
    render();

    const $countDisplay = document.querySelector('.count-display');
    const $decBtn = document.querySelector('.btn-dec');
    const $incBtn = document.querySelector('.btn-inc');

    $decBtn.addEventListener('click', () => {
      const currCount = Number($countDisplay.value);
      if (currCount <= MIN_COUNT) return;
      $countDisplay.value = currCount - 1;
    });

    $incBtn.addEventListener('click', () => {
      const currCount = Number($countDisplay.value);
      if (currCount >= MAX_COUNT) return;
      $countDisplay.value = currCount + 1;
    });
  };

  init();
}
