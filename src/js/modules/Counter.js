export default function Counter({ $app }) {
  const increase = () => {
    const $countDisplay = document.querySelector('.count-display');
    const currCount = Number($countDisplay.value);
    if (currCount >= 12) return;
    $countDisplay.value = currCount + 1;
  };

  const decrease = () => {
    const $countDisplay = document.querySelector('.count-display');
    const currCount = Number($countDisplay.value);
    if (currCount <= 8) return;
    $countDisplay.value = currCount - 1;
  };

  const render = () => {
    $app.innerHTML = `
       <div class="container">
          <h1>ui counter</h1>
          <div class="counter">
            <a href="#" class="btn-dec"><span>-</span></a>
            <input name="count" type="text" class="count-display" value="10">
            <a href="#" class="btn-inc"><span>+</span></a>
          </div>
        </div>`;
  };

  const init = () => {
    render();

    const $decBtn = document.querySelector('.btn-dec');
    $decBtn.addEventListener('click', decrease);

    const $incBtn = document.querySelector('.btn-inc');
    $incBtn.addEventListener('click', increase);
  };

  init();
}
