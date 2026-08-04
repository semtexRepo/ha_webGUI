/*
* SCENE CONTROL
*/
function syncSceneCount() {
  const scenes = document.getElementById('scenes');
  if (!scenes) return;

  const count = Math.min(Math.max(scenes.querySelectorAll('.scene-tile').length, 1), 8);
  scenes.dataset.count = count;
}

function selectScene(id) {
  // will call HA service here
}

/*
* VISIBILITY CONTROL
*/
function openSection(id) {
  // open section based on id
  const main_view = document.getElementById('main_view');
  const button = event?.currentTarget || window.event?.currentTarget;

  // remove active class from all buttons
  document.querySelectorAll('.bar-btn').forEach((item) => item.classList.remove('active'));
  if (button) {
    button.classList.add('active');
  }

  console.log('section:', id);

  // hide app if open
  if (main_view) {
    main_view.classList.add('hidden');
  }

  const sectionMap = {
    climate: document.getElementById('climate_view'),
    light: document.getElementById('light_view'),
    openings: document.getElementById('openings_view'),
    settings: document.getElementById('settings_view')
  };

  Object.entries(sectionMap).forEach(([key, view]) => {
    if (view) {
      view.classList.toggle('hidden', key !== id);
    }
  });
}

function closeSection(id) {
  const main_view = document.getElementById('main_view');
  const sectionMap = {
    climate: document.getElementById('climate_view'),
    light: document.getElementById('light_view'),
    openings: document.getElementById('openings_view'),
    settings: document.getElementById('settings_view')
  };

  if (main_view) {
    main_view.classList.remove('hidden');
  }

  const view = sectionMap[id];
  if (view) {
    view.classList.add('hidden');
  }

  document.querySelectorAll('.bar-btn').forEach((item) => item.classList.remove('active'));
  const firstButton = document.querySelector('.bar-btn');
  if (firstButton) {
    firstButton.classList.add('active');
  }

}

syncSceneCount();

new MutationObserver(syncSceneCount).observe(document.getElementById('scenes'), {
  childList: true,
  subtree: true
});
