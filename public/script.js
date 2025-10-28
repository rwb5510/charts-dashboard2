document.addEventListener('DOMContentLoaded', () => {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const dataDisplayArea = document.getElementById('data-display-area');

  // --- File Upload Setup ---
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
  });

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      renderTable(json);
    };
    reader.readAsArrayBuffer(file);
  }

  // --- Table Rendering ---
  function renderTable(json) {
    dataDisplayArea.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'min-w-full border border-gray-200 rounded-lg overflow-hidden';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    Object.keys(json[0]).forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.className = 'px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    json.forEach(row => {
      const tr = document.createElement('tr');
      Object.keys(row).forEach(key => {
        const td = document.createElement('td');
        td.textContent = row[key];
        td.setAttribute('data-label', key);
        td.className = 'px-3 py-2 border-b text-sm text-gray-700';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    dataDisplayArea.appendChild(table);

    addGearMenuToTable(table);
  }

  // --- Column Visibility Gear ---
  function addGearMenuToTable(table) {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    const menu = document.createElement('div');
    menu.className = 'column-menu';
    const gear = document.createElement('button');
    gear.innerHTML = '⚙️';
    gear.className = 'absolute top-[-2.5rem] right-0 text-gray-600 hover:text-blue-600 text-lg';
    wrapper.appendChild(gear);
    wrapper.appendChild(table);
    wrapper.appendChild(menu);
    dataDisplayArea.appendChild(wrapper);

    gear.addEventListener('click', () => {
      menu.innerHTML = '';
      const headers = table.querySelectorAll('th');
      headers.forEach((th, i) => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !th.classList.contains('hidden-column');
        cb.addEventListener('change', () => toggleColumn(table, i));
        label.append(cb, th.textContent);
        menu.append(label);
      });
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!gear.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }

  function toggleColumn(table, i) {
    table.querySelectorAll('tr').forEach(tr => {
      const cell = tr.children[i];
      if (cell) cell.classList.toggle('hidden-column');
    });
  }
});
