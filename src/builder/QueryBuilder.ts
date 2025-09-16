import { Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;
  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }
  search(searchFields: string[]) {
    if (this?.query?.search) {
      this.modelQuery = this.modelQuery.find({
        $or: searchFields.map((el) => ({
          [el]: { $regex: this?.query?.search, $options: 'i' },
        })),
      });
    }
    return this;
  }
  sort() {
    let sortBy = 'createdAt';
    let sortOrder = 'desc';
    if (this?.query?.sortBy) {
      sortBy = this?.query?.sortBy as string;
    }
    if (this?.query?.sortOrder) {
      sortOrder = this?.query?.sortOrder as string;
    }
    this.modelQuery = this.modelQuery.sort({
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    });
    return this;
  }
  filter() {
    const queryObj = { ...this?.query };
    const excludeFields = ['search', 'page', 'limit', 'sortBy', 'sortOrder'];
    excludeFields.forEach((el) => delete queryObj[el]);
    if (this.query?.status === 'All') {
      delete queryObj.status;
    }
    if (this.query?.vehicleType === 'All') {
      delete queryObj.vehicleType;
    }
    if (this.query?.availability === 'All') {
      delete queryObj.availability;
    }
    if (Object.entries(queryObj).length) {
      this.modelQuery = this?.modelQuery.find(queryObj);
    }
    return this;
  }
  paginate() {
    const page = Number(this?.query?.page || 1);
    const limit = Number(this?.query?.limit || 10);
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }
  async getMetaData() {
    const page = Number(this?.query?.page || 1);
    const limit = Number(this?.query?.limit || 10);

    // Await the count query
    const total = await this.modelQuery.model.countDocuments(
      this.modelQuery.getFilter(),
    );

    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
