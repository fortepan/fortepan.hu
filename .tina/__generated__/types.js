export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const Photo_UploadsPartsFragmentDoc = gql`
    fragment Photo_uploadsParts on Photo_uploads {
  uploads {
    __typename
    name
    date
    cover_image
    hu {
      __typename
      title
      blurb
      actions {
        __typename
        best_of
        all
      }
    }
    en {
      __typename
      title
      blurb
      actions {
        __typename
        best_of
        all
      }
    }
  }
}
    `;
export const HetifortepanPartsFragmentDoc = gql`
    fragment HetifortepanParts on Hetifortepan {
  hu {
    __typename
    date
    cover_image
    title
    excerpt
    url
  }
  en {
    __typename
    date
    cover_image
    title
    excerpt
    url
  }
}
    `;
export const Pages_HuPartsFragmentDoc = gql`
    fragment Pages_huParts on Pages_hu {
  ... on Pages_huProjects {
    title
    body
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
    title
    permalink
    body
  }
  ... on Pages_huHome {
    title
    body
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
    title
  }
}
    `;
export const Pages_EnPartsFragmentDoc = gql`
    fragment Pages_enParts on Pages_en {
  ... on Pages_enProjects {
    title
    body
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
    title
    permalink
    body
  }
  ... on Pages_enHome {
    title
    body
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
    title
  }
}
    `;
export const SettingsPartsFragmentDoc = gql`
    fragment SettingsParts on Settings {
  latestDate
  tax1percent
}
    `;
export const Photo_UploadsDocument = gql`
    query photo_uploads($relativePath: String!) {
  photo_uploads(relativePath: $relativePath) {
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
    ...Photo_uploadsParts
  }
}
    ${Photo_UploadsPartsFragmentDoc}`;
export const Photo_UploadsConnectionDocument = gql`
    query photo_uploadsConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: Photo_uploadsFilter) {
  photo_uploadsConnection(
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
        ...Photo_uploadsParts
      }
    }
  }
}
    ${Photo_UploadsPartsFragmentDoc}`;
export const HetifortepanDocument = gql`
    query hetifortepan($relativePath: String!) {
  hetifortepan(relativePath: $relativePath) {
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
    ...HetifortepanParts
  }
}
    ${HetifortepanPartsFragmentDoc}`;
export const HetifortepanConnectionDocument = gql`
    query hetifortepanConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: HetifortepanFilter) {
  hetifortepanConnection(
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
        ...HetifortepanParts
      }
    }
  }
}
    ${HetifortepanPartsFragmentDoc}`;
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
export const SettingsDocument = gql`
    query settings($relativePath: String!) {
  settings(relativePath: $relativePath) {
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
    ...SettingsParts
  }
}
    ${SettingsPartsFragmentDoc}`;
export const SettingsConnectionDocument = gql`
    query settingsConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: SettingsFilter) {
  settingsConnection(
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
        ...SettingsParts
      }
    }
  }
}
    ${SettingsPartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    photo_uploads(variables, options) {
      return requester(Photo_UploadsDocument, variables, options);
    },
    photo_uploadsConnection(variables, options) {
      return requester(Photo_UploadsConnectionDocument, variables, options);
    },
    hetifortepan(variables, options) {
      return requester(HetifortepanDocument, variables, options);
    },
    hetifortepanConnection(variables, options) {
      return requester(HetifortepanConnectionDocument, variables, options);
    },
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
    },
    settings(variables, options) {
      return requester(SettingsDocument, variables, options);
    },
    settingsConnection(variables, options) {
      return requester(SettingsConnectionDocument, variables, options);
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
