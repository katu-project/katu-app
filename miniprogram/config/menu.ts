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
    {
      icon: 'apps',
      title: '通用',
      url: 'general'
    },
    {
      icon: 'profile',
      title: '账户',
      url: 'account'
    },
    {
      icon: 'file',
      title: '数据',
      url: 'data'
    },
    {
      icon: 'unlock',
      title: '安全',
      url: 'security'
    },
    {
      icon: 'repair',
      title: '调试',
      url: '/packages/debug/pages/index',
      hide: true
    }
  ]
}

export default MenuConfig