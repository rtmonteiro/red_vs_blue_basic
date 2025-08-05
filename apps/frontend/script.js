const redButton = document.getElementById('red-btn');
const blueButton = document.getElementById('blue-btn');
const resultDiv = document.getElementById('result');

async function makeRequest(color) {
    try {
        console.log(`Making ${color} request...`);
        const response = await fetch(`http://localhost:3000/api/${color}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: color })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('Response:', data);
        resultDiv.innerHTML = data;
        return data;
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `Error: ${error.message}`;
        alert(`Error: ${error.message}`);
    }
}

redButton.addEventListener('click', () => makeRequest('red'));
blueButton.addEventListener('click', () => makeRequest('blue'));
