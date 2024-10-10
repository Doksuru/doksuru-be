import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

//좋아요순으로 정렬 후 limit 5개씩 정렬
router.route('/list/:challengeId').get(async (req, res) => {
  const { challengeId } = req.params;
  const { userId } = req.query;
  const { page = 1, limit = 5 } = req.query;

  const offset = (page - 1) * limit;

  const works = await prisma.work.findMany({
    where: {
      challengeId: Number(challengeId),
    },
    orderBy: [
      { likeCount: 'desc' },
      { lastModifiedAt: 'desc' },
      { id: 'desc' },
    ],
    skip: offset,
    take: 5,
  });

  const total = await prisma.work.count({
    where: {
      challengeId: Number(challengeId),
    },
  });

  // let isLike =

  res.status(200).json({ works, totalPages: Math.ceil(total / limit), total });
});

// 작업물 상세조회
router.route('/:workId').get(async (req, res) => {
  const { workId } = req.params;

  const works = await prisma.work.findUnique({
    where: {
      id: Number(workId),
    },
    include: {
      challenge: {
        select: {
          title: true,
          field: true,
          docType: true,
        },
      },
      user: {
        select: {
          nickName: true,
        },
      },
    },
  });

  res.status(200).json({ works });
});

// 챌린지 아이디에 따른 작업물 작성
router.route('/:challengeId/post').post(async (req, res) => {
  const { challengeId } = req.params;
  const { description } = req.body;
  // const {userId} = req.query

  const userId = 1;

  const works = await prisma.work.create({
    data: {
      description: description,
      userId: Number(userId),
      challengeId: Number(challengeId),
      isSubmitted: true,
    },
  });

  res.status(201).json({ works });
});

// 작업물 수정
router.route('/:workId/edit').patch(async (req, res) => {
  const { workId } = req.params;
  const { description } = req.body;

  const works = await prisma.work.update({
    where: { id: Number(workId) },
    data: {
      description: description,
    },
  });

  res.status(201).json({ works });
});

//작업물 삭제하면 participate에서도 삭제
router.route('/:workId/delete').delete(async (req, res) => {
  const { workId } = req.params;
  // const { userId } = req.query;

  const userId = 1;

  const participate = await prisma.participate.findFirst({
    where: {
      userId: Number(userId),
    },
  });

  await prisma.$transaction(async (prisma) => {
    await prisma.work.delete({
      where: {
        id: Number(workId),
      },
    });

    await prisma.participate.delete({
      where: {
        id: Number(participate.id),
      },
    });
  });

  res.sendStatus(204);
});

//작업물에 좋아요 누르기 - 좋아요 분리하기(게시물을 조회할 때 하트 여부 알아야 함)

router.route('/:workId/likes').post(async (req, res) => {
  const { workId } = req.params;
  // const { userId } = req.query;

  const userId = 1;

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      workId: Number(workId),
    },
  });

  if (existingLike) {
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      }),
      prisma.work.update({
        where: { id: Number(workId) },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return res.status(200).json({ message: '좋아요가 삭제됐습니다.' });
  } else {
    await prisma.$transaction([
      prisma.like.create({
        data: {
          workId: Number(workId),
          userId: userId,
        },
      }),
      prisma.work.update({
        where: { id: Number(workId) },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return res.status(200).json({ message: '좋아요가 추가됐습니다.' });
  }
});

//작업물 피드백 조회
router.route('/:workId/feedbacks').get(async (req, res) => {
  const { workId } = req.params;

  const feedbacks = await prisma.feedback.findMany({
    where: { workId: Number(workId) },
  });

  res.status(200).json({ feedbacks });
});

export default router;
