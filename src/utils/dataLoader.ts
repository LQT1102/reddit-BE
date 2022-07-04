import DataLoader from "dataloader";
import { In } from "typeorm";
import { Upvote } from "./../entities/Upvote";
import { User } from "./../entities/User";

interface VoteTypeCondition{
    postId: number
    userId: number
}

const batchGetUsers = async (userIds: number[]) => {
    const users = await User.find({where:{
        id: In(userIds)
    }})

    return userIds.map((id) => users.find(u => u.id === id));
}

const batchGetVoteType = async (voteTypeConditions: VoteTypeCondition[]) => {
    const voteTypes = await Upvote.find({
        where: voteTypeConditions
    });

    return voteTypeConditions.map(voteTypeCondition =>  voteTypes.find((vt) => vt.postId === voteTypeCondition.postId && vt.userId === voteTypeCondition.userId))
}

export const buildDataLoaders = () => ({
    userLoader: new DataLoader<number, User | undefined>(userIds => batchGetUsers(userIds as number[])),

    voteTypeLoader: new DataLoader<VoteTypeCondition, Upvote | undefined>(voteTypeConditions => batchGetVoteType(voteTypeConditions as VoteTypeCondition[]))
})