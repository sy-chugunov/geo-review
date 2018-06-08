ymaps.ready(function () {
    let placemark,
        geoObjects = [],
        allReviews = [],
        addressOnClick = '',
        coords,
        method = 'post',
        host = 'http://localhost:3000/';

    yandexMap = new ymaps.Map('map', {
        center: [55.755381, 37.619044],
        zoom: 12,
        behaviors: ['default', 'scrollZoom'],
        controls: ['smallMapDefaultSet']
    }, {
            searchControlProvider: 'yandex#search'
        });

    document.addEventListener('click', function (e) {
        e.preventDefault();
        switch (e.target.id) {
            case 'feedback':
                clickOnMap(e.target.getAttribute("data-x") + ' ' + e.target.getAttribute("data-y"));
                break;
            case 'button-save':
                sendButton();
                break;
            case 'close':
                closeButton();
                break;
        }
    });

    getAllPlaceMarks();

    function getAllPlaceMarks() {
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open(method, host, true);
        xhr.onload = function() {
            clusterer.removeAll();
            allReviews = [];
            for (let address in xhr.response) {
                let reviews = xhr.response[address];
                reviews.forEach(function(review) {
                    let single = false;
                    if (reviews.length === 1) {
                        single = true;
                    }
                    putPlacemark([review.coords.x, review.coords.y], address,
                         review.name, review.place, review.text, review.date, single);
                    allReviews.push(review);
                });
            }
            getReviewsOnAddress(addressOnClick);
        };
        xhr.send(JSON.stringify({op: 'all'}));
    }

    function putPlacemark(coords, address, name, place, text, date, single) {
        placemark = createPlacemark(coords);
        placemark.isSingle = single;
        placemark.coords = coords;
        placemark.properties.set({
            balloonContentHeader: '<a href="" id="feedback" data-x="' + coords[0] + '" data-y="' + coords[1] + '">' + address + '</a>',
            balloonContentBody: place + '<br>' + text,
            balloonContentFooter: '<strong>' + name + '</strong> ' + time(date)
        });

        clusterer.add(placemark);
    }

    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {}, {
            preset: 'islands#violetDotIcon',
            balloonContentLayout: customItemContentLayout
        });
    }

    customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="list_item">{{ geoObject.properties.balloonContentHeader|raw }}</div>' +
        '<h3 class=ballon_body>{{ properties.balloonContentBody|raw }}</h3>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    );

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5
    });

    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    clusterer.events.add('click', function (e) {
        if (e.get('target').isSingle) {
            let clickCoords = e.get('target').coords;
            clickOnMap(clickCoords);
        }
    })

    clusterer.events.add('balloonopen', function (e) {
        if (e.get('target').isSingle) {
            yandexMap.balloon.close();
        }
    })

    clusterer.add(geoObjects);
    yandexMap.geoObjects.add(clusterer);

    yandexMap.events.add('click', function (e) {
        let clickCoords = e.get('coords');
        if (yandexMap.balloon.isOpen()) {
            yandexMap.balloon.close();
        }
        clickOnMap(clickCoords);
    });


    function clickOnMap(clickCoords) {
        if (yandexMap.balloon.isOpen) {
            yandexMap.balloon.close();
        }

        let review = document.querySelector('.review'),
            x = event.pageX + 380,
            y = event.pageY + 578;

        if (x > window.innerWidth) {
            review.style.left = (x - (x - window.innerWidth)) - 400 + 'px';
        } else {
            review.style.left = event.pageX + 'px'
        }
        if (y > window.innerHeight) {
            review.style.top = (y - (y - window.innerHeight)) - 570 + 'px';
        } else {
            review.style.top = event.pageY + 'px'
        }
        review.classList.remove('hide');

        getAddress(clickCoords).then(function (res) {
            addressOnClick = res.properties.get('description') + ',' + ' ' + res.properties.get('name');
            document.querySelector('.address').innerText = addressOnClick;
            coords = res.geometry.getCoordinates();

            getReviewsOnAddress(addressOnClick);
        });
    }

    function getAddress(clickCoords) {
        return ymaps.geocode(clickCoords, { results: 1 }).then(function (res) {
            return res.geoObjects.get(0);
        });
    }

    function getReviewsOnAddress(addressOnClick) {
        let reviewsOnAddres = [];

        allReviews.forEach(function (item) {
            if (addressOnClick.indexOf(item.address) > -1) {
                if (!isNaN(item.date)) {
                    item.date = time(item.date);
                }
                reviewsOnAddres.push(item);
            }
        });

        reviewsOnAddres.reverse();

        rewiewsList.innerHTML = '';

        let source = rewiewsListTemplate.innerHTML,
            templateFn = Handlebars.compile(source),
            template = templateFn({ list: reviewsOnAddres });
        if (!reviewsOnAddres[0]) {
            rewiewsList.innerHTML = 'Отзывов пока нет...';
        } else {
            rewiewsList.insertAdjacentHTML("afterBegin", template);
            reviewsOnAddres = [];
        }
    }

    function closeButton() {
        document.querySelector('.review').classList.toggle('hide');
        clearInputs();
    }

    function sendButton() {
        let yourname = document.getElementById('yourname'),
            place = document.getElementById('place'),
            text = document.getElementById('text');

        (!yourname.value) ? yourname.classList.add('error') : yourname.classList.remove('error');
        (!place.value) ? place.classList.add('error') : place.classList.remove('error');
        (!text.value) ? text.classList.add('error') : text.classList.remove('error');

        if (yourname.value && place.value && text.value) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, host, true);
            xhr.send(JSON.stringify({
                op: 'add',
                review: {
                    coords: {
                        x: coords[0],
                        y: coords[1]
                    },
                    address: addressOnClick,
                    name: yourname.value,
                    place: place.value,
                    text: text.value
                }
            }));
            clearInputs();
            getAllPlaceMarks();
        }
    }

    function time(date) {
        date = new Date(date);
        return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
    }

    function clearInputs() {
        yourname.value = '';
        yourname.classList.remove('error');
        place.value = '';
        place.classList.remove('error');
        text.value = '';
        text.classList.remove('error');
    }
});