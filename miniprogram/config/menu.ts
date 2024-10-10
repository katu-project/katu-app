const MenuConfig = {
  profile: [
    {
      icon: 'choiceness',
      name: '兔币明细',
      url: 'quota/index',
      dev: true,
      needActive: true
    },
    {
      icon: 'tag',
      name: '卡片标签',
      url: 'card/edit-tag/index',
      needActive: true
    },
    {
      icon: 'settings',
      name: '软件设置',
      url: 'settings/index',
      needActive: true
    },
    {
      icon: 'question',
      name: '使用帮助 ( Q&A )',
      url: 'qa/index',
      pass: true
    },
    {
      icon: 'info',
      name: '关于卡兔',
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
    name: '功能',
    value: 'function'
  }, {
    icon: 'settings',
    color: 'cyan',
    name: '设置',
    value: 'setting'
  }, {
    icon: 'people',
    color: 'orange',
    name: '账户',
    value: 'account'
  }, {
    icon: 'safe',
    color: 'red',
    name: '安全',
    value: 'safe'
  }, {
    icon: 'recharge',
    color: 'olive',
    name: '配额',
    value: 'quota'
  }, {
    icon: 'more',
    color: 'blue',
    name: '其他',
    value: 'other'
  }]
}

export default MenuConfig