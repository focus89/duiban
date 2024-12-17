const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 模拟数据
const mockWorks = [
  {
    id: '1',
    title: '示例作品 1',
    coverImage: 'https://picsum.photos/400/300?random=1',
    author: {
      id: '1',
      nickname: '用户1',
      avatar: 'https://picsum.photos/48/48?random=1'
    },
    stats: {
      likes: 42,
      comments: 18,
      shares: 7
    }
  },
  {
    id: '2',
    title: '示例作品 2',
    coverImage: 'https://picsum.photos/400/300?random=2',
    author: {
      id: '2',
      nickname: '用户2',
      avatar: 'https://picsum.photos/48/48?random=2'
    },
    stats: {
      likes: 38,
      comments: 15,
      shares: 5
    }
  }
];

// API 路由
app.get('/api/work/list', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const list = mockWorks.slice(start, end);
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      list,
      total: mockWorks.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/work/:id', (req, res) => {
  const work = mockWorks.find(w => w.id === req.params.id);
  if (work) {
    res.json({
      code: 0,
      message: 'success',
      data: work
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '作品不存在'
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 