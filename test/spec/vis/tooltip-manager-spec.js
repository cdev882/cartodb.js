var Backbone = require('backbone');
var MapView = require('../../../src/geo/map-view');
var Map = require('../../../src/geo/map');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var TooltipManager = require('../../../src/vis/tooltip-manager');

describe('src/vis/tooltip-manager.js', function () {
  beforeEach(function () {
    var windshaftMap = new Backbone.Model({});
    windshaftMap.isNamedMap = function () { return false; };
    this.map = new Map({}, {
      windshaftMap: windshaftMap
    });
    this.layerView = new Backbone.Model();
    var layerViewFactory = jasmine.createSpyObj('layerViewFactory', ['createLayerView']);
    layerViewFactory.createLayerView.and.returnValue(this.layerView);

    this.mapView = new MapView({
      map: this.map,
      layerViewFactory: layerViewFactory
    });
    this.mapView.getNativeMap = function () {};
    this.mapView._addLayerToMap = function () {};
    this.mapView.latLonToPixel = function () { return { x: 0, y: 0 }; };
    this.mapView.getSize = function () { return { x: 1000, y: 1000 }; };

    this.vis = {
      mapView: this.mapView
    };
  });

  it('should add a new tooltip view to the map view when new layers are reseted', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var tooltipManager = new TooltipManager(this.vis);
    tooltipManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addOverlay).toHaveBeenCalled();
  });

  it('should add a new tooltip view to the map view when new layers are added', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var tooltipManager = new TooltipManager(this.vis);
    tooltipManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addOverlay).toHaveBeenCalled();
  });

  it('should NOT add a new infowindow view to the map view when new layers share the same layerView', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var layer2 = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }]
      }
    });

    var tooltipManager = new TooltipManager(this.vis);
    tooltipManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    expect(this.mapView.addOverlay.calls.count()).toEqual(1);
  });

  it('should NOT add a new infowindow view to the map view when new layers are added if layer doesn\'t have infowindow fields', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: []
      }
    });

    var tooltipManager = new TooltipManager(this.vis);
    tooltipManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addOverlay).not.toHaveBeenCalled();
  });

  it('should correctly bind the featureOver event to the corresponding layerView', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
        template: 'template1',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names1'
      }
    });
    var layer2 = new CartoDBLayer({
      tooltip: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    });

    var tooltipManager = new TooltipManager(this.vis);
    tooltipManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    spyOn(tooltipView, 'setTemplate');
    spyOn(tooltipView, 'setFields');
    spyOn(tooltipView, 'setAlternativeNames');

    this.layerView.model = {
      layers: new Backbone.Collection([ layer1, layer2 ])
    };

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(tooltipView.setTemplate).toHaveBeenCalledWith('template1');
    expect(tooltipView.setFields).toHaveBeenCalledWith([{
      'name': 'name',
      'title': true,
      'position': 1
    }]);
    expect(tooltipView.setAlternativeNames).toHaveBeenCalledWith('alternative_names1');

    // Simulate the featureOver event on layer #1
    this.layerView.trigger('featureOver', {}, [100, 200], undefined, { cartodb_id: 10 }, 1);

    expect(tooltipView.setTemplate).toHaveBeenCalledWith('template2');
    expect(tooltipView.setFields).toHaveBeenCalledWith([{
      'name': 'description',
      'title': true,
      'position': 1
    }]);
    expect(tooltipView.setAlternativeNames).toHaveBeenCalledWith('alternative_names2');
  });
});
