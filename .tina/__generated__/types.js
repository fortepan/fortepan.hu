export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const Pages_HuPartsFragmentDoc = gql`
    fragment Pages_huParts on Pages_hu {
  ... on Pages_huProjects {
    body
    layout
    title
    permalink
    hide_search
    projects {
      __typename
      title
      project_date
      description
      funding_info
      funding_logo
    }
  }
  ... on Pages_huArticle {
    layout
    title
    permalink
    body
  }
  ... on Pages_huHome {
    body
    layout
    title
    permalink
    best_of_collections {
      __typename
      title
      caption
      content {
        __typename
        title
        counter
        cover_image
        url
      }
    }
    blog {
      __typename
      title
      caption
      action {
        __typename
        label
        url
      }
    }
    latest {
      __typename
      title
      caption
      action {
        __typename
        label
        url
      }
    }
  }
  ... on Pages_huDefault {
    layout
    title
    permalink
  }
}
    `;
export const Pages_EnPartsFragmentDoc = gql`
    fragment Pages_enParts on Pages_en {
  ... on Pages_enProjects {
    body
    layout
    title
    permalink
    hide_search
    projects {
      __typename
      title
      project_date
      description
      funding_info
      funding_logo
    }
  }
  ... on Pages_enArticle {
    layout
    title
    permalink
    body
  }
  ... on Pages_enHome {
    body
    layout
    title
    permalink
    best_of_collections {
      __typename
      title
      caption
      content {
        __typename
        title
        counter
        cover_image
        url
      }
    }
    blog {
      __typename
      title
      caption
      action {
        __typename
        label
        url
      }
    }
    latest {
      __typename
      title
      caption
      action {
        __typename
        label
        url
      }
    }
  }
  ... on Pages_enDefault {
    layout
    title
    permalink
  }
}
    `;
export const Pages_HuDocument = gql`
    query pages_hu($relativePath: String!) {
  pages_hu(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...Pages_huParts
  }
}
    ${Pages_HuPartsFragmentDoc}`;
export const Pages_HuConnectionDocument = gql`
    query pages_huConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: Pages_huFilter) {
  pages_huConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...Pages_huParts
      }
    }
  }
}
    ${Pages_HuPartsFragmentDoc}`;
export const Pages_EnDocument = gql`
    query pages_en($relativePath: String!) {
  pages_en(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...Pages_enParts
  }
}
    ${Pages_EnPartsFragmentDoc}`;
export const Pages_EnConnectionDocument = gql`
    query pages_enConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: Pages_enFilter) {
  pages_enConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...Pages_enParts
      }
    }
  }
}
    ${Pages_EnPartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    pages_hu(variables, options) {
      return requester(Pages_HuDocument, variables, options);
    },
    pages_huConnection(variables, options) {
      return requester(Pages_HuConnectionDocument, variables, options);
    },
    pages_en(variables, options) {
      return requester(Pages_EnDocument, variables, options);
    },
    pages_enConnection(variables, options) {
      return requester(Pages_EnConnectionDocument, variables, options);
    }
  };
}
import { createClient } from "tinacms/dist/client";
const generateRequester = (client) => {
  const requester = async (doc, vars, _options) => {
    const data = await client.request({
      query: doc,
      variables: vars
    });
    return { data: data?.data, query: doc, variables: vars || {} };
  };
  return requester;
};
export const ExperimentalGetTinaClient = () => getSdk(
  generateRequester(createClient({ url: "http://localhost:4001/graphql", queries }))
);
export const queries = (client) => {
  const requester = generateRequester(client);
  return getSdk(requester);
};
