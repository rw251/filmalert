module.exports = (films) => `
<table class="table">
  <thead>
    <tr>
      <th class="pointer" id="filmHeader">Films<span id="filmCaret"></span></th>
      <th class="pointer" id="whenHeader">When<span id="whenCaret"></span></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    ${films.map((film) => `
    <tr id="row-id-${film.id}">
      <td>${film.name} (${film.year})</td>
      <td>${film.channel} ${film.when}</td>
      <td>
        <button class="btn btn-danger btn-xs" type="button" onclick="removeFilm(${film.id})">
          <span class="glyphicon glyphicon-trash"></span><span class="hidden-xs"> Delete</span>
        </button>
      </td>
    </tr>
    `).join('')}
  </tbody>
</table>`
