jQuery(function ($) {
	const config = Joomla.getOptions('meta') || {};
	const $builder = $('.hu-menu-builder');
	/**
	 * Perform operation in reactive way
	 */

	const state = {
		menuItems: {},
	};

	const defaultRowSettings = {
		row_label: '',
		enable_row_title: false,
		row_title: '',
		row_id: '',
		row_class: '',
		row_margin: '',
		row_padding: '',
		row_hide_phone: false,
		row_hide_large_phone: false,
		row_hide_tablet: false,
		row_hide_small_desktop: false,
		row_hide_desktop: false,
	};

	const defaultColSettings = {
		col: 12,
		col_label: '',
		col_type: 'module',
		module_position: '',
		module: '',
		module_style: 'sp_xhtml',
		menu_items: '[]',
	};

	const fields = getFields();
	const rowSettingsFields = getRowSettingsFields();

	const setState = function (object, callback = undefined) {
		Object.entries(object).forEach(([key, value]) => {
			state[key] = value;
		});

		!!callback && callback(state);
		render();
	};

	var $inputField = $('.hu-menu-builder').find('.hu-megamenu-field');

	(function componentDidMount() {
		initBuilderData();

		/**
		 * Initialized the functions
		 */
		handlingMenuItemSelection();
		activateMenuItemSorting();
		makeRowSortable();
		addNewRow();
		deleteRow();
		toggleColumnOptions();
		generateColumns();
		columnSorting();
	})();

	function initBuilderData() {
		const $builder = $('.hu-menu-builder');
		const menuItems = {};
		$builder.find('.hu-menu-item').each(function (index) {
			const itemId = $(this).data('cid');

			const item = {
				id: $(this).data('cid'),
				title: $(this).data('name'),
				menu_custom_classes: '',
				menu_icon: '',
				menu_caption: '',
				mega_menu: 0,
				mega_width: '',
				mega_custom_classes: '',
				mega_rows: [
					{
						id: 1,
						settings: defaultRowSettings,
						columns: [],
					},
				],
			};

			menuItems[itemId] = item;
		});

		if ($inputField.val() === '' || $inputField.val() === '{}') {
			setState({ menuItems });
		} else {
			setState({ menuItems: JSON.parse($inputField.val()).menuItems });
		}
	}

	function getFields() {
		return [
			{
				event: 'blur',
				parent: '.hu-menu-builder',
				selectors: [
					'input[name=menu_custom_classes]',
					'input[name=menu_icon]',
					'input[name=menu_caption]',
					'input[name=mega_width]',
					'input[name=mega_custom_classes]',
					'input[name=row_label]',
					'input[name=row_title]',
					'input[name=row_id]',
					'input[name=row_class]',
				],
			},
			{
				event: 'change',
				parent: '.hu-menu-builder',
				selectors: [
					'input[name=mega_menu]',
					'input[name=mega_alignment]',
					'input[name=enable_row_title]',
				],
			},
		];
	}
	function getRowSettingsFields() {
		return [
			{
				event: 'blur',
				parent: '.hu-menu-builder',
				selectors: [
					'row_label',
					'row_title',
					'row_id',
					'row_class',
					'row_margin',
					'row_padding',
				],
			},
			{
				event: 'change',
				parent: '.hu-menu-builder',
				selectors: [
					'enable_row_title',
					'row_hide_phone',
					'row_hide_large_phone',
					'row_hide_tablet',
					'row_hide_small_desktop',
					'row_hide_desktop',
				],
			},
		];
	}

	(function handleInputChange(fields) {
		fields.forEach(events => {
			events.selectors.forEach(selector => {
				$(document).on(
					events.event,
					`${events.parent} ${selector}`,
					function (e) {
						let value = $(this).val();
						const name = $(this).attr('name'),
							itemId = $(this).data('itemid'),
							type = $(this).attr('type');

						if (type === 'checkbox') {
							value = $(this).prop('checked') >> 0;
						}

						if (!itemId) return;

						setState({
							menuItems: {
								...state.menuItems,
								[itemId]: {
									...state.menuItems[itemId],
									[name]: value,
								},
							},
						});
					}
				);
			});
		});
	})(fields);

	(function handleRowSettingsInputChange(fields) {
		fields.forEach(events => {
			events.selectors.forEach(selector => {
				$(document).on(
					events.event,
					`input[name=${selector}]`,
					function (e) {
						let value = $(this).val();
						const name = $(this).attr('name'),
							itemId = $(this).data('itemid'),
							rowId = $(this).data('rowid'),
							type = $(this).attr('type');

						if (type === 'checkbox') {
							value = $(this).prop('checked') >> 0;
						}

						if (!itemId || !rowId) return;

						let rows = [...state.menuItems[itemId].mega_rows];
						let rowIndex = rows.findIndex(row => row.id === rowId);

						if (rowIndex > -1) {
							let settings = {
								...rows[rowIndex].settings,
								[name]: value,
							};

							rows[rowIndex].settings = settings;
						}

						setState({
							menuItems: {
								...state.menuItems,
								[itemId]: {
									...state.menuItems[itemId],
									mega_rows: rows,
								},
							},
						});
					}
				);
			});
		});
	})(rowSettingsFields);

	function render() {
		// Update input value
		console.log('state:', state);

		$('.hu-menu-builder')
			.find('.hu-megamenu-field')
			.val(JSON.stringify(state));

		// .trigger('change');

		renderDOM();
	}

	function renderDOM() {
		renderingRowLabel();
	}

	function renderingRowLabel() {
		// Render row labels
		const menuItems = state.menuItems;
		Object.values(menuItems).forEach(items => {
			if (items.mega_rows.length > 0) {
				items.mega_rows.forEach(row => {
					let $parent = $(
						`.hu-menu-builder .hu-megamenu-layout-section[data-itemid=${items.id}][data-rowid=${row.id}]`
					);
					$parent
						.find('.hu-megamenu-section-title')
						.text(row.settings.row_label);
				});
			}
		});
	}

	/** ================================================================== */

	/**
	 * Handling the menu selection on click event
	 */
	function handlingMenuItemSelection() {
		$('.hu-menu-item').on('click', function (event) {
			event.preventDefault();
			const $siblings = $(this).siblings();

			if ($siblings.hasClass('active')) {
				$siblings.removeClass('active');
			}

			if (!$(this).hasClass('active')) {
				$(this).addClass('active');
			}

			triggerMenuSettings($(this).data('name'));
		});
	}

	/**
	 * Activating the menu item sorting
	 */
	function activateMenuItemSorting() {
		$('.hu-menu-items')
			.sortable({
				containment: '.hu-menu-items-wrapper',
				cursor: 'move',
				opacity: 0.6,
				scroll: true,
				axis: 'x',
				tolerance: 'pointer',
				update: (event, ui) => {
					const $items = $('.hu-menu-items > li');
					const data = {
						cid: [],
						order: [],
					};

					$items.each(function (index, el) {
						data.cid.push($(el).data('cid'));
						data.order.push(index + 1);
					});

					saveMenuOrder(data);
				},
			})
			.disableSelection();
	}

	/**
	 * Make the mega menu rows sortable
	 */
	function makeRowSortable() {
		let prevIndex = null;

		$('#hu-megamenu-layout-container.active-layout')
			.sortable({
				placeholder: 'ui-state-highlight',
				forcePlaceholderSize: true,
				containment: '.hu-mega-basic-settings',
				handle: '.hu-megamenu-move-row',
				cursor: 'move',
				opacity: 1,
				axis: 'y',
				tolerance: 'pointer',
				start: function (event, ui) {
					prevIndex = ui.item.index();
				},
				update: function (event, ui) {
					const item = ui.item;
					const currIndex = item.index();
					const rowId = item.data('rowid');
					const itemId = item.data('itemid');

					swapRows(itemId, prevIndex - 1, currIndex - 1);
				},
			})
			.disableSelection();
	}

	/**
	 * Trigger Menu item settings
	 *
	 * @param {string} active Active class
	 */
	function triggerMenuSettings(active) {
		$('.hu-menu-item-settings').removeClass('active');
		$('.hu-menu-item-settings')
			.find('#hu-megamenu-layout-container')
			.removeClass('active-layout');

		$(`.hu-menu-item-settings.hu-menu-item-${active}`).addClass('active');
		$(`.hu-menu-item-settings.hu-menu-item-${active}`)
			.find('#hu-megamenu-layout-container')
			.addClass('active-layout');

		makeRowSortable();
	}

	/**
	 * Add a new row after a specific row
	 */
	function addNewRow() {
		$(document).on('click', '.hu-megamenu-add-row', function (e) {
			e.preventDefault();
			$('.hu-megamenu-layout-row').sortable('destroy');
			const $parent = $(this).closest('.hu-megamenu-layout-section');
			const $cloned = $('#hu-megamenu-layout-container.active-layout')
				.find('.hu-reserved-layout-section')
				.clone(true);
			const rowId = getLastRowId() + 1;

			const itemId = $parent.data('itemid');

			$cloned
				.removeClass('hu-reserved-layout-section')
				.addClass('hu-megamenu-layout-section')
				.attr('data-rowid', rowId)
				.data('rowid', rowId)
				.hide();

			$cloned.insertAfter($parent);
			$cloned.slideDown(300);

			const insertIndex = $parent.index();
			insertNewRow(itemId, insertIndex, {
				id: rowId,
				settings: defaultRowSettings,
				columns: [],
			});

			const $column = $cloned.find('.hu-megamenu-layout-column');
			$column.data('rowid', rowId);
			$column.attr('data-rowid', rowId);

			columnSorting();
		});
	}

	/**
	 * Insert a new row
	 *
	 * @param {int} 	itemId 	The menu Item Id
	 * @param {int} 	index 	Insertion index
	 * @param {object} 	newItem The item to insert
	 */
	function insertNewRow(itemId, index, newItem) {
		let rows = [...state.menuItems[itemId].mega_rows];
		rows.splice(index, 0, newItem);

		setState({
			menuItems: {
				...state.menuItems,
				[itemId]: {
					...state.menuItems[itemId],
					mega_rows: rows,
				},
			},
		});
	}

	/**
	 * Swap two rows positions
	 *
	 * @param {int} itemId 		Menu Item Id
	 * @param {int} prevIndex 	Index before sorting
	 * @param {int} currIndex 	Index after sorting
	 */
	function swapRows(itemId, prevIndex, currIndex) {
		const rows = [...state.menuItems[itemId].mega_rows];
		const item = rows.splice(prevIndex, 1);

		if (item.length === 0) return;

		rows.splice(currIndex, 0, item[0]);

		setState({
			menuItems: {
				...state.menuItems,
				[itemId]: {
					...state.menuItems[itemId],
					mega_rows: rows,
				},
			},
		});
	}

	/**
	 * Delete a row
	 */
	function deleteRow() {
		$(document).on('click', '.hu-megamenu-remove-row', function (e) {
			e.preventDefault();

			const totalSections = $(this)
				.closest('.hu-megamenu-layout-section')
				.siblings().length;

			if (totalSections <= 0) {
				return;
			}

			const confirm = window.confirm('Are you sure to delete the row?');
			if (confirm) {
				$section = $(this).closest('.hu-megamenu-layout-section');
				const itemId = $section.data('itemid');
				const rowId = $section.data('rowid');

				const rows = [...state.menuItems[itemId].mega_rows];
				const rowIndex = rows.findIndex(row => row.id === rowId);
				rows.splice(rowIndex, 1);

				setState({
					menuItems: {
						...state.menuItems,
						[itemId]: {
							...state.menuItems[itemId],
							mega_rows: rows,
						},
					},
				});

				$section.slideUp(300, function () {
					$(this).remove();
				});
			} else {
				return;
			}
		});
	}

	/**
	 * Toggle column options.
	 * This will brings you the column layouts for generation.
	 */
	function toggleColumnOptions() {
		$(document).on('click', '.hu-megamenu-add-columns', function (e) {
			e.preventDefault();
			const $colList = $(this).next('.hu-megamenu-column-list');
			$colList.toggleClass('show');
		});
	}

	/**
	 * Generate columns from column options.
	 */
	function generateColumns() {
		$(document).on('click', '.hu-megamenu-column-layout', function (e) {
			$('.hu-megamenu-layout-row').sortable('destroy');

			const $section = $(this).closest('.hu-megamenu-layout-section');

			const itemId = $section.data('itemid');
			const rowId = $section.data('rowid');

			let layout = $(this).data('layout');

			if (layout === 'custom') {
				layout = prompt(
					'Enter your custom layout like 4+2+2+2+2 as total 12 grid',
					'4+2+2+2+2'
				);
			}

			const grids = layout
				.trim()
				.split('+')
				.map(col => col >> 0);

			if (isValidLayout(grids)) {
				let columnStr = '';

				let columns = [];

				const $reservedColumn = $section
					.find('.hu-megamenu-reserved-layout-column')
					.clone(true);

				if ($reservedColumn) {
					$reservedColumn.removeClass('col-12');
				}

				grids.forEach((col, index) => {
					$reservedColumn
						.removeClass('hu-megamenu-reserved-layout-column')
						.addClass('hu-megamenu-layout-column')
						.addClass(`col-${col}`);
					$reservedColumn.data('rowid', rowId);
					$reservedColumn.attr('data-rowid', rowId);
					$reservedColumn.data('columnid', index + 1);
					$reservedColumn.attr('data-columnid', index + 1);

					columnStr += $reservedColumn[0].outerHTML;

					defaultColSettings.col = col;
					columns.push({
						id: index + 1,
						itemId,
						settings: defaultColSettings,
						rowId,
					});
				});

				const rows = [...state.menuItems[itemId].mega_rows];
				const rowIndex = rows.findIndex(
					row => row.id >> 0 === rowId >> 0
				);
				rows[rowIndex].columns = columns;

				setState({
					menuItems: {
						...state.menuItems,
						[itemId]: {
							...state.menuItems[itemId],
							mega_rows: rows,
						},
					},
				});

				const $gParent = $(this).closest('.hu-megamenu-layout-section');
				$gParent.find('.hu-megamenu-layout-row').html(columnStr);
				$(this).closest('.hu-megamenu-column-list').removeClass('show');
				columnSorting();
			} else {
				alert(
					'Your grid is invalid. The summation of the columns never exceed 12'
				);
			}
		});
	}

	/**
	 * Swap columns positions between themselves.
	 *
	 * @param {int} itemId 		Menu Item ID
	 * @param {int} rowId 		Row ID
	 * @param {int} prevIndex 	The index number before sorting
	 * @param {int} currIndex 	The index number after sorting
	 */
	function swapColumn(itemId, rowId, prevIndex, currIndex) {
		const rows = [...state.menuItems[itemId].mega_rows];
		const rowItem = rows.find(row => row.id === rowId) || false;
		const rowIndex = rows.findIndex(row => row.id === rowId);

		if (rowIndex > -1) {
			const columns = rowItem.columns || [];
			const item = columns.splice(prevIndex, 1);

			if (!item) return;

			columns.splice(currIndex, 0, item[0]);

			rows[rowIndex].columns = columns;

			setState({
				menuItems: {
					...state.menuItems,
					[itemId]: {
						...state.menuItems[itemId],
						mega_rows: rows,
					},
				},
			});
		}
	}

	/**
	 * Functionalities for colum sorting between themselves.
	 */
	function columnSorting() {
		let prevIndex = null;

		$('.hu-megamenu-layout-row')
			.sortable({
				connectWith: '.hu-megamenu-layout-row',
				placeholder: 'ui-state-highlight',
				forcePlaceholderSize: true,
				axis: 'x',
				opacity: 1,
				tolerance: 'pointer',
				start: function (event, ui) {
					$('.hu-megamenu-layout-section')
						.find('.ui-state-highlight')
						.addClass($(ui.item).attr('class'));
					$('.hu-megamenu-layout-section')
						.find('.ui-state-highlight')
						.css('height', $(ui.item).outerHeight());
					prevIndex = ui.item.index();
				},
				update: function (event, ui) {
					const item = ui.item;
					const itemId = item.data('itemid');
					const rowId = item.data('rowid');
					const itemIndex = item.index();

					swapColumn(itemId, rowId, prevIndex, itemIndex);
				},
			})
			.disableSelection();
	}

	/**
	 * Utility functions
	 */
	function isValidLayout(grids) {
		return grids.reduce((acc, curr) => acc + curr) <= 12;
	}

	/**
	 * Get the last row Id for generating next row
	 */
	function getLastRowId() {
		const ids = [];
		$(
			'.hu-menu-builder #hu-megamenu-layout-container.active-layout .hu-megamenu-layout-section'
		).each(function (index, el) {
			ids.push($(el).data('rowid'));
		});

		return Math.max(...ids);
	}

	/** ========================================================================= */

	/**
	 * Save menu ordering after D&D
	 * @param {object} data		The orderID anc CID object
	 */
	function saveMenuOrder(data) {
		const url = `${config.base}/administrator/index.php?option=com_menus&view=items&task=items.saveOrderAjax&tmpl=component`;

		$.ajax({
			method: 'POST',
			url,
			data,
			beforeSend: () => {
				Joomla.helixLoading(true);
			},
			success: response => {
				Joomla.reloadPreview();
			},
			error: err => {
				alert(err);
			},
			completed: () => {
				Joomla.helixLoading(false);
			},
		});
	}
	/** ===================================================================== */

	/**
	 * Row Settings
	 */
	$(document).on(
		'click',
		'.hu-menu-builder .hu-megamenu-row-options',
		function (e) {
			e.preventDefault();
			$(this).helixUltimateOptionsModal({
				flag: 'row-setting',
				title: "<span class='fas fa-cog'></span> Row Settings",
				class: 'hu-modal-small',
			});

			const $parent = $(this).closest('.hu-megamenu-layout-section');
			const itemId = $parent.data('itemid');
			const rowId = $parent.data('rowid');

			const $cloned = $(this)
				.closest('.hu-megamenu-layout-section')
				.find('.hu-mega-row-settings')
				.clone(true);
			$cloned.data('rowid', rowId).attr('data-rowid', rowId);

			reflectStateDataIntoClonedRowSettings(itemId, rowId, $cloned);

			$('.hu-options-modal-inner').html(
				$cloned
					.removeClass('hidden')
					.addClass('hu-options-modal-content')
			);
		}
	);

	function reflectStateDataIntoClonedRowSettings(itemId, rowId, $container) {
		const rows = [...state.menuItems[itemId].mega_rows];
		const row = rows.find(row => row.id === rowId);

		if (!!row) {
			const fields = rowSettingsFields.reduce(
				(acc, curr) => [...acc, ...curr.selectors],
				[]
			);
			fields.forEach(field => {
				let $inputField = $container.find(`input[name=${field}]`);
				const type = $inputField.attr('type');
				$inputField.data('rowid', rowId).attr('data-rowid', rowId);
				if (type === 'checkbox') {
					$inputField.prop('checked', row.settings[field]);
				} else {
					$inputField.val(row.settings[field]);
				}
			});
		}
	}

	/** ====================================================== */

	/**
	 * Column settings
	 */
	$(document).on(
		'click',
		'.hu-menu-builder .hu-megamenu-column-options',
		function (e) {
			e.preventDefault();
			$(this).helixUltimateOptionsModal({
				flag: 'col-setting',
				title: "<span class='fas fa-cog'></span> Column Settings",
				class: 'hu-modal-small',
			});

			const $parent = $(this).closest('.hu-megamenu-layout-column');

			$parent.find('select.hu-input').each(function () {
				$(this).chosen('destroy');
			});

			const itemId = $parent.data('itemid');
			const rowId = $parent.data('rowid');
			const columnId = $parent.data('columnid');

			const $cloned = $parent.find('.hu-mega-column-setting').clone(true);
			console.log($parent, $cloned);

			$cloned.find('select.hu-input').each(function () {
				$(this).chosen({ width: '100%' });
			});

			$('.hu-options-modal-inner').html(
				$cloned
					.removeClass('hidden')
					.addClass('hu-options-modal-content')
			);
		}
	);
});