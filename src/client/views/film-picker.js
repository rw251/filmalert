module.exports = (films) => `
<table class="table">
  <thead>
    <tr>
      <th>Film</th>
      <th>Year</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    ${films.map((film) => `
    <tr>
      <td>${film.name}</td>
      <td>${film.year}</td>
      <td>
        <button class="btn btn-default" onclick="addFilm(${film.id}, ${film.name}, ${film.year})">Add</button>
      </td>
    </tr>
    `).join('')}
    </tbody>
</table>`