<?php
/**
 * @package 	Helix_Ultimate_Framework
 * @author 		JoomShaper <joomshaper@js.com>
 * @copyright 	Copyright (c) 2010 - 2020 JoomShaper
 * @license 	http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 or Later
 */
namespace HelixUltimate\Framework\HttpResponse;

use HelixUltimate\Framework\Platform\Builders\MenuBuilder;
use Joomla\CMS\Application\ApplicationHelper;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Language\Associations;
use Joomla\CMS\Language\LanguageHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

defined('_JEXEC') or die();

/**
 * Class for Ajax Http Response.
 * This is handle Ajax request.
 *
 * @since   1.0.0
 */
class Response
{
	/**
	 * Response for the request getMenuItems.
	 *
	 * @return	array
	 * @since	2.0.0
	 */
	public static function getMenuItems()
	{
		$input = Factory::getApplication()->input;
		$menuType = $input->get('menutype', 'mainmenu', 'STRING');

		$items = self::getItems($menuType);

		return [
			'status' => true,
			// 'data' => self::generateMenuItemHTML($items, $items, 1),
			'data' => self::generateMenuTree($items),
			'items' => $items
		];
	}

	/**
	 * Response for the request parentAdoption
	 *
	 * @return	array
	 * @since	2.0.0
	 */
	public static function parentAdoption()
	{
		$input = Factory::getApplication()->input;
		$itemId = $input->post->get('id', 0, 'INT');
		$parentId = $input->post->get('parent', 0, 'INT');

		if ($itemId > 0 && $parentId > 0)
		{
			$data = new \stdClass;
			$data->id = $itemId;
			$data->parent_id = $parentId;

			$classUrl = JPATH_ADMINISTRATOR . '/components/com_menus/models/item.php';

			if (!\class_exists('MenusModelItem'))
			{
				require_once $classUrl;
			}

			\JTable::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_menus/tables');

			try
			{
				$controller = new \MenusModelItem;
				$db = Factory::getDbo();
				$db->updateObject('#__menu', $data, 'id');

				$controller->rebuild();
			}
			catch (Exception $e)
			{
				echo $e->getMessage();
			}
		}

		return [
			'status' => true,
			'data' => [$data]
		];
	}

	/**
	 * Get Menu Items for a specific menu type
	 *
	 * @return	string
	 * @since	2.0.0
	 */
	private static function getItems($menuType)
	{
		$items = [];

		try
		{
			$db 	= Factory::getDbo();
			$query 	= $db->getQuery(true);

			$query->select('id, title, menutype, alias, parent_id, level, lft, rgt')
				->from($db->qn('#__menu'))
				->where($db->qn('menutype') . ' = ' . $db->q($menuType))
				->where($db->qn('published') . ' = 1');
			$query->order($db->qn('lft') . ' ASC');

			$db->setQuery($query);

			$items = $db->loadObjectList();
		}
		catch (Exception $e)
		{
			echo $e->getMessage();
		}

		return $items;
	}

	/**
	 * Generate Menu Item Tree
	 *
	 * @param	array	$items	The items array.
	 *
	 * @return 	string	The HTML string.
	 * @since	2.0.0
	 */
	private static function generateMenuTree($items)
	{
		$html = [];

		if (!empty($items))
		{
			$html[] = '<ul id="tree">';

			foreach ($items as $key => $item)
			{
				$html[] = '<li class="tree-branch branch-level-' . $item->level . '" data-itemid="' . $item->id . '" data-parent="' . $item->parent_id . '" >';
				$html[] = '	<div class="contents">';
				$html[] = '		<div class="branch-drag-handler">';
				$html[] = '			<span class="icon fas fa-bars"></span>';
				$html[] = '			<span class="branch-title">' . $item->title . '</span>';
				$html[] = '		</div>';
				$html[] = '	</div>';
				$html[] = '<div class="children-bus"></div>';
				$html[] = '</li>';
			}

			$html[] = '</ul>';
		}

		return implode("\n", $html);
	}

	

	/**
	 * Get menu items adding modal body.
	 *
	 * @return	string	The HTML string.
	 * @since	2.0.0
	 */
	public static function getMenuItemModalContents()
	{
		$builder = new MenuBuilder;

		$fields = [
			'title' => [
				'type' => 'text',
				'title' => 'Title',
				'data' => ['itemid' => 1],
				'value' => '',
				'internal' => true,
			],
			'alias' => [
				'type' => 'text',
				'title' => 'Alias',
				'data' => ['itemid' => 1],
				'value' => '',
				'internal' => true,
			],
			'menutype' => [
				'type' => 'menuType',
				'title' => 'Menu Item Type',
				'internal' => true
			]
		];

		$html = [];
		$html[] = '<div class="hu-modal-content">';
		$html[] = '<div class="hu-add-item-wrapper">';
		
		foreach ($fields as $key => $attr)
		{
			$html[] = $builder->renderFieldElement($key, $attr);
		}

		$html[] = '<div class="hu-item-request"></div>';
		$html[] = '<div class="hu-item-link"></div>';

		$html[] = '</div>';
		$html[] = '</div>';

		return [
			'status' => true,
			'data' => implode("\n", $html),
			'item' => \HelixultimateFieldMenuType::getMenuTypes()
		];
	}
}
