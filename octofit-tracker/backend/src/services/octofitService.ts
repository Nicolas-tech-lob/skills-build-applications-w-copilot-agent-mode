import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Activity input is invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof mascot !== 'string' || mascot.trim().length === 0 ||
    (members !== undefined && !Array.isArray(members))
  ) {
    throw Object.assign(new Error('Team input is invalid'), { status: 400 });
  }

  const memberIds = (members ?? []) as unknown[];
  if (!memberIds.every((memberId) => typeof memberId === 'string' && Types.ObjectId.isValid(memberId))) {
    throw Object.assign(new Error('Team member IDs are invalid'), { status: 400 });
  }

  const existingMembers = memberIds.length === 0
    ? []
    : await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== new Set(memberIds).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: existingMembers.map((member) => member._id),
  });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        let: { teamId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } },
        ],
        as: 'activityTotals',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $ifNull: [{ $arrayElemAt: ['$activityTotals.totalPoints', 0] }, 0] },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const goal = user.fitnessGoal?.trim().toLowerCase();
  if (goal) {
    const goalWorkouts = await Workout.find({ focus: goal }).lean();
    if (goalWorkouts.length > 0) {
      return goalWorkouts.map((workout) => ({
        ...workout,
        reason: `Recommended because it matches your ${goal} fitness goal.`,
      }));
    }
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .select('type')
    .lean();
  if (!recentActivity) return [];

  const activityType = recentActivity.type.trim().toLowerCase();
  const focus = ['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(activityType)
    ? 'endurance'
    : activityType;
  const activityWorkouts = await Workout.find({ focus }).lean();
  return activityWorkouts.map((workout) => ({
    ...workout,
    reason: `Recommended based on your recent ${recentActivity.type} activity.`,
  }));
}

export { User };
