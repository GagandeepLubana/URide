// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const routes = [];

class app {
  #mapEvent;
  #markers = [];
  #routes;

  constructor() {
    this.map;
    this._getPosition();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.map = L.map("map").setView(coords, 8);

    L.tileLayer(
      "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.map);

    var geocoder = L.Control.geocoder()
      .on("markgeocode", (e) => {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest(),
        ]).addTo(this.map);
        this.map.fitBounds(poly.getBounds());
      })
      .addTo(this.map);

    L.marker(coords).addTo(this.map).bindPopup("You are here.").openPopup();

    this.map.clicks = 0;
    this.map.route = {};
    this._cityBikes();
    this.map.on("click", this._showRoute.bind(this));
  }

  _cityBikes() {
    var purpleIcon = L.icon({
      iconUrl: "purple-pin.png",
      iconSize: [10, 20], // size of the icon
      iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -24], // point from which the popup should open relative to the iconAnchor
    });

    function getNetworks() {
      return $.get("https://api.citybik.es/v2/networks").pipe(function (data) {
        return data;
      });
    }

    $.when(getNetworks()).done((networks) => {
      var net_layer = L.layerGroup([]);
      _.each(networks.networks, (net) => {
        var popup =
          "<ul>" +
          "<li class='city'>" +
          net.location.city +
          "</li>" +
          "<li class='network'>" +
          net.name +
          "</li>" +
          "</ul>";
        L.marker([net.location.latitude, net.location.longitude], {
          icon: purpleIcon,
        })
          .addTo(net_layer)
          .bindPopup(popup, { className: "dark-popup network-popup" });
      });
      net_layer.addTo(this.map);
    });
  }

  _showRoute(mapE) {
    this.#mapEvent = mapE;
    const { lat, lng } = this.#mapEvent.latlng;

    if (this.map.clicks === 0) {
      this._createMarker(lat, lng, "Route Start");
      this.map.clicks += 1;
      this.map.route.start = [lat, lng];
    } else {
      this._createMarker(lat, lng, "Route End");
      this.map.clicks = 0;
      this.map.route.end = [lat, lng];
      this._newRoute();
    }
  }

  _newRoute() {
    // L.Routing.control({
    //   waypoints: [
    //     L.latLng(this.map.route.start[0], this.map.route.start[1]),
    //     L.latLng(this.map.route.end[0], this.map.route.end[1]),
    //   ],
    //   router: new L.Routing.graphHopper("a6ccda78-82ef-4200-a7b7-28e81d9fe6f8", {
    //     urlParameters: {
    //       vehicle: "bike",
    //     },

    //   }),
    //   routeWhileDragging: false
    // }).addTo(this.map);
    var control = L.Routing.control({
      router: new L.Routing.graphHopper(
        "a6ccda78-82ef-4200-a7b7-28e81d9fe6f8",
        {
          urlParameters: {
            vehicle: "bike",
          },
        }
      ),
      plan: L.Routing.plan(
        [
          L.latLng(this.map.route.start[0], this.map.route.start[1]),
          L.latLng(this.map.route.end[0], this.map.route.end[1]),
        ],
        {
          createMarker: function (i, wp) {
            return L.marker(wp.latLng, {
              draggable: true,
              icon: L.icon.glyph({ glyph: String.fromCharCode(65 + i) }),
            });
          },
          geocoder: L.Control.Geocoder.nominatim(),
          routeWhileDragging: false,
        }
      ),
      routeWhileDragging: false,
      routeDragTimeout: 250,
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: "black", opacity: 0.15, weight: 9 },
          { color: "white", opacity: 0.8, weight: 6 },
          { color: "blue", opacity: 0.5, weight: 2 },
        ],
      },
    })
      .addTo(this.map)
      .on("routingerror", function (e) {
        try {
          this.map.getCenter();
        } catch (e) {
          this.map.fitBounds(L.latLngBounds(waypoints));
        }

        handleError(e);
      });

    L.Routing.errorControl(control).addTo(this.map);
    this.map.removeLayer(this.#markers[0]);
    this.map.removeLayer(this.#markers[1]);
    this.#markers = [];
  }

  _createMarker(lat, lng, popup) {
    const marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "runnin-popup",
        })
      )
      .setPopupContent(popup)
      .openPopup();
    this.#markers.push(marker);
    this.map.addLayer(marker);
  }
}

const application = new app();
