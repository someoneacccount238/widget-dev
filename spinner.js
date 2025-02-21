// // If no exact results, show spinner before additional search
// if (!result1.length) {
//     const spinner2 = document.createElement('div');
//     spinner2.style.display = 'flex';
//     spinner2.style.justifyContent = 'center';
//     spinner2.style.alignItems = 'center';
//     spinner2.style.width = '100%';
//     const spinnerImg = document.createElement('img');
//     spinnerImg.src = 'widget/loading_spinner.gif';
//     spinnerImg.className = 'loading-spinner';
//     spinner2.appendChild(spinnerImg);
//     resultContainer.appendChild(spinner2);
// }

// Remove second spinner if it exists
const spinner2 = resultContainer.querySelector('.loading-spinner');
if (spinner2) {
    spinner2.remove();
}