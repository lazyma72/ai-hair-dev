module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // ==============================================
    // 【核心】禁止手动写 any（报错级别）
    // ==============================================
    '@typescript-eslint/no-explicit-any': 'error',

    // ==============================================
    // 禁止使用 unknown（如果你想完全禁用）
    // ==============================================
    '@typescript-eslint/no-unsafe-unknown': 'error',

    // ==============================================
    // 禁止使用 Object、Function 这种模糊类型
    // ==============================================
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: '不要使用 Object，使用具体类型',
          Function: '不要使用 Function，使用箭头函数类型',
          Boolean: '不要使用包装对象，使用 boolean',
          Number: '不要使用包装对象，使用 number',
          String: '不要使用包装对象，使用 string',
          Symbol: '不要使用包装对象，使用 symbol',
        },
      },
    ],

    // ==============================================
    // 禁止 any 类型的赋值、调用、传播
    // ==============================================
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // ==============================================
    // 强制所有函数有返回值类型
    // ==============================================
    '@typescript-eslint/explicit-function-return-type': 'error',

    // ==============================================
    // 强制数组必须指定泛型（禁止 Array 这种模糊写法）
    // ==============================================
    '@typescript-eslint/no-unsafe-argument': 'error'
  },
};