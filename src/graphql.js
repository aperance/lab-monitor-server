const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat
} = require("graphql");

exports.createSchema = deviceStore => {
  const DeviceType = new GraphQLObjectType({
    name: "Device",
    fields: {
      timestamp: {
        type: GraphQLFloat,
        resolve: device => device.timestamp
      },
      data: {
        type: GraphQLString,
        resolve: device => JSON.stringify(device.data)
      }
    }
  });

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        device: {
          type: DeviceType,
          args: {
            id: { type: GraphQLString }
          },
          resolve: (root, args) => deviceStore.get(args.id)
        }
      }
    })
  });
};
