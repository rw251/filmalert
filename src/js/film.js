//TODO
//When not logged in allow or disallow film searches - don't just hang.
//Allow logout

var elFilms,
	elFilmName,
	elActions,
	elPickFilmTable,
	elBtn,
	elLoader,
	elFilmCaret,
	elWhenCaret,
	currentFilms,
	films = [];

//Generic sort by key for array of objects
function sortBy(key, desc) {
	if (!desc) desc = 1;
	else desc = -1;
	return function(a, b) {
		if (a[key] < b[key]) return -1 * desc;
		if (a[key] > b[key]) return 1 * desc;
		return 0;
	};
}

function appendRows() {
	for (var i = 0; i < films.length; i++) {
		elFilms.find('tbody').append(row(films[i]));
	}
}

function removeFilm(id) {
	films = films.filter(function(el) {
		return el.id !== id;
	});
}

function row(film, hidden) {
	return $("<tr " + (hidden ? "style='display:none'" : "") + "id='" + film.id + "'><td>" + film.name + " (" + film.year + ")</td><td>" + film.channel + " " + film.when + "</td><td><button class='btn btn-danger btn-xs' type='button' id='rem" + film.id + "'><span class='glyphicon glyphicon-trash'></span><span class='hidden-xs'> Delete</span></button></td></tr>");
}

function redrawFilms() {
	//make table
	elFilms.find('tbody').html("");
	appendRows();
	elFilms.show();
	elActions.show();
}

function getMyFilms() {
	$.ajax({
		url: "index.php/listfilms",
		type: "POST",
		dataType: "json",
		success: function(data) {
			if (data.status == "success") {
				films = [];
				for (var i = 0; i < data.data.length; i++) {
					var film = {
						"id": data.data[i].id,
						"name": data.data[i].cell[0],
						"year": data.data[i].cell[1],
						"channel": data.data[i].cell[2],
						"when": data.data[i].cell[3]
					};
					films.push(film);
				}

				redrawFilms();
			}
		}
	});
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js?v1');
}

$(document).ready(function() {
	elFilms = $('#myFilms');
	elFilmName = $('#filmName');
	elActions = $('#actions');
	elPickFilmTable = $('#pickFilm');
	elBtn = $('#btnFind');
	elLoader = $('#ajaxLoader');
	elFilmCaret = $('#filmHeader').find('span');
	elWhenCaret = $('#whenHeader').find('span');

	elFilmName.on('keyup', function(e) {
		if (e.which == 13) {
			elBtn.click();
		}
	});

	elBtn.on('click', function() {
		elPickFilmTable.empty();
		elActions.hide();
		elLoader.show();

		$.ajax({
				url: "index.php/films/find/" + elFilmName.val(),
				type: "POST",
				dataType: "json"
			}).done(function(data) {
				if (data.status == "success") {
					//persist
					currentFilms = {};

					//construct 
					var body = $("<tbody></tbody>");

					for (var i = 0; i < data.films.length; i++) {
						body.append($("<tr><td>" + data.films[i].name + "</td><td>" + data.films[i].year + "</td><td><button class='btn btn-default' id='add" + data.films[i].id + "'>Add</button></td></tr>"));
						currentFilms[String(data.films[i].id)] = data.films[i];
					}

					//add
					elPickFilmTable.append(body);
				}
				else {
					elPickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
				}
			}).fail(function() {
				elPickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
			})
			.always(function() {
				elActions.show();
				elLoader.hide();
			});
	});

	elPickFilmTable.on('click', 'button', function() {
		var imdbId = this.id.substring(3);
		elActions.hide();
		elLoader.show();

		$.ajax({
				url: "index.php/films/add/" + imdbId + "/" + currentFilms[imdbId].name + "/" + currentFilms[imdbId].year,
				type: "POST",
				dataType: "json"
			}).done(function(data) {
				if (data.status == "success") {
					data.film.channel = data.film.channel || "";
					data.film.when = data.film.when || "";
					//update table
					films.push(data.film);
					var r = row(data.film, true);
					//r.hide();
					elFilms.find('tbody').prepend(r);
					r.toggle("highlight", 800);
				}
				else {
					elPickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
				}
			})
			.fail(function() {
				elPickFilmTable.append($("<tbody><tr><td>Oops.. that didn't work. Maybe try again?</td></tr></tbody>"));
			})
			.always(function() {
				elActions.show();
				elLoader.hide();
				//hide table
				elPickFilmTable.empty();
			});
	});

	elFilms.on('click', 'button', function() {
		var imdbId = this.id.substring(3);
		//todo hide row with ajax
		$(this).hide();
		$.ajax({
				url: "index.php/films/remove/" + imdbId,
				type: "POST",
				dataType: "json"
			}).done(function(data) {
				if (data.status == "success") {
					//update table
					removeFilm(data.film.imdbId);
					elFilms.find('#' + data.film.imdbId).toggle("highlight", 800, function() {
						$(this).remove();
					});
					//remove ajax and row
				}
				else {
					elFilms.find('#' + data.film.imdbId).find('button').show();
				}
				//todo reinstate row
			})
			.fail(function() {
				elFilms.find('#' + imdbId).find('button').show();
			})
	});

	$('#filmHeader').on('click', function() {
		elWhenCaret.removeClass("caret");
		elFilmCaret.addClass("caret");
		elFilmCaret.toggleClass("caret-reversed");
		films.sort(sortBy("name", !elFilmCaret.hasClass("caret-reversed")));
		redrawFilms();
	});
	$('#whenHeader').on('click', function() {
		elFilmCaret.removeClass("caret");
		elWhenCaret.addClass("caret");
		films.sort(sortBy("when", true));
		redrawFilms();
	});

	getMyFilms();
});