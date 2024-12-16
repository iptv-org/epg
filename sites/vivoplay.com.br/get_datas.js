const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const genresUrl = 'https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/contents/all?contentTypes=GEN&fields=Pid,Titler&limit=10000';
const ratingUrl = 'https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/contents/all?contentTypes=AGE&fields=Pid,Titler,Description,images&limit=10000'

async function downloadJson(url, filePath) {
    try {
        const response = await axios.get(url);

        fs.outputJSON(filePath, response.data);
    } catch (error) {
        console.error('Ocorreu um erro ao baixar o JSON:', error);
    }
}

async function fetchPersons(offset) {
    const url = `https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/contents/all?contentTypes=PER&fields=Pid,Title&orderBy=contentOrder&limit=10000&offset=${offset}`;

    try {
        const response = await axios.get(url);
        return response.data.Content.List;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return [];
    }
}

async function getAllPersons() {
    let allPersons = [];
    let offset = 0;

    do {
        const persons = await fetchPersons(offset);
        if (persons.length === 0) {
            break;
        }
        allPersons = allPersons.concat(persons);
        offset += persons.length; 
    } while (true);

    return allPersons;
}

async function saveToJson(data) {
    fs.outputJSON(path.join(__dirname, 'data', 'persons.json'), data);
    console.log('Dados salvos em persons.json');
}

async function main() {
    const allPersons = await getAllPersons();
    await saveToJson(allPersons);
}

main();
downloadJson(genresUrl, path.join(__dirname, 'data', 'genres.json'));
downloadJson(ratingUrl, path.join(__dirname, 'data', 'ratings.json'));
