(function () {
module("Model");

test('Project: basics', function () {
  var project = new DataExplorer.Model.Project({name: 'abc'});
  equal(project.get('name'), 'abc');
  equal(project.scripts.length, 1);
  equal(project.get('manifest_version'), 1);
  equal(project.datasets.length, 0);
  equal(project.get('views').length, 3);
});

test('Project: datasets', function () {
  var project = new DataExplorer.Model.Project({datasets: [ { id: 'xyz', format: 'json' } ]});
  equal(project.datasets.length, 1);
  equal(project.datasets.get('xyz').get('format'), 'json');
});

test('Project: loadSourceDataset', function () {
  var project = new DataExplorer.Model.Project({
    datasets: [ 
      {
        id: 'xyz',
        backend: 'csv',
        data: 'Date,Yield\n2012,1.8'
      }
    ]
  });
  project.loadSourceDataset(function(err, project) {
    equal(project.datasets.at(0).get('backend'), 'csv')  
    equal(project.datasets.at(0)._store.records.length, 1);
    equal(project.datasets.at(0).fields.length, 2);
    deepEqual(project.datasets.at(0).fields.at(0).toJSON(), {
      id: 'Date',
      type: 'string',
      label: 'Date',
      is_derived: false,
      format: null
    });
  });
});

test('serializeProject', function () {
  var csvData = 'Date,Yield\n2012,1.8\n';
  var project = new DataExplorer.Model.Project({
    name: 'test it',
    datasets: [ 
      {
        id: 'xyz',
        backend: 'csv',
        data: csvData,
        path: 'data.csv'
      }
    ]
  });
  project.loadSourceDataset(function() {});

  // serialize test start
  var out = DataExplorer.Model.serializeProject(project);
  var dataFile = 'data.csv';
  var dp = JSON.parse(out.files['datapackage.json'].content);
  deepEqual(_.keys(out.files), ['datapackage.json', 'scripts/main.js', dataFile]);
  ok(!_.hasOwnProperty(dp.scripts[0], 'content'), 'content key should be removed');
  deepEqual(out.files['scripts/main.js'].content, 'print("hello world")');
  deepEqual(out.files['data.csv'].content, csvData);
  equal(dp.datasets[0].data, undefined);

  var newScriptContent = 'request("...")';
  out.files['scripts/main.js'].content = newScriptContent;

  // now unserialize ...
  var newProject = DataExplorer.Model.unserializeProject(out);
  equal(newProject.get('name'), project.get('name'));
  equal(newProject.scripts.at(0).get('content'), newScriptContent);
  equal(newProject.datasets.at(0).get('data'), csvData);
});

})();
