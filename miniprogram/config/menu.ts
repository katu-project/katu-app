const MenuConfig = {
  profile: [
    {
      icon: 'choiceness',
      name: 'quota',
      url: 'quota/index',
      dev: true,
      needActive: true
    },
    {
      icon: 'tag',
      name: 'tag',
      url: 'card/edit-tag/index',
      needActive: true
    },
    {
      icon: 'settings',
      name: 'settings',
      url: 'settings/index',
      needActive: true
    },
    {
      icon: 'question',
      name: 'help',
      url: 'qa/index',
      pass: true
    },
    {
      icon: 'info',
      name: 'about',
      url: 'about/index',
      pass: true
    }
  ],
  settings: [
    [
      {
        icon: 'profile',
        title: 'account',
        url: 'account',
        bg: 'green'
      }
    ],
    [
      {
        icon: 'apps',
        title: 'general',
        url: 'general',
        bg: 'blue'
      },
      {
        icon: 'discover',
        title: 'ui',
        url: 'ui',
        bg: 'pink'
      },
      {
        icon: 'unlock',
        title: 'security',
        url: 'security',
        bg: 'yellow'
      },
      {
        icon: 'file',
        title: 'data',
        url: 'data',
        bg: 'cyan'
      }
    ],
    [
      {
        icon: 'explore',
        title: 'advanced',
        url: 'adv',
        bg: 'green'
      },
      {
        icon: 'repair',
        title: 'debug',
        url: '/packages/debug/pages/index',
        devOnly: true
      }
    ]
  ],
  qa: [{
    icon: 'apps',
    color: 'green',
    name: 'function',
    value: 'function'
  }, {
    icon: 'settings',
    color: 'cyan',
    name: 'setting',
    value: 'setting'
  }, {
    icon: 'people',
    color: 'orange',
    name: 'account',
    value: 'account'
  }, {
    icon: 'safe',
    color: 'red',
    name: 'safe',
    value: 'safe'
  }, {
    icon: 'recharge',
    color: 'olive',
    name: 'quota',
    value: 'quota'
  }, {
    icon: 'more',
    color: 'blue',
    name: 'other',
    value: 'other'
  }]
}

export default MenuConfig