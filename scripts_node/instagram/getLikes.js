const _ = require('lodash');
const { insertLikesFromPost } = require('../model/like');
const delay = require('delay');
require('isomorphic-fetch');


const query_hash = '1cb6ec562846122743b61e492c85999f';
const max = 50;
const getUrl = (postShortCode, end_cursor = '') => `https://www.instagram.com/graphql/query/?query_hash=${query_hash}&variables={"shortcode":"${postShortCode}","first": ${max},"after":"${end_cursor}"}`;

module.exports = async (postShortCode, postId, ownerId, headers) => {
  try {
    let next = true;
    let end_cursor = undefined;
    let edges = [];
    let c = 1; 
    let i=0;
    while (i<2) {
      const res = await fetch(getUrl(postShortCode, end_cursor), { 
        headers
      });
      const resJSON = await res.json();
      if(resJSON.status == 'fail') {
        console.log('request fail');
        await delay(60000);
      } else {
        const edge_liked_by = resJSON.data.shortcode_media.edge_liked_by;
        
        next = edge_liked_by.page_info.has_next_page;
        end_cursor = edge_liked_by.page_info.end_cursor;
        edges = _.concat(edges, edge_liked_by.edges);
        const data = edge_liked_by.edges.map(e => (
          [
            postShortCode,
            ownerId,
            e.node.id,
          ]
        ));
        insertLikesFromPost(data);
        i += 1;
        console.log(edges.length);
      }
    }

    return edges.length;
  } catch (err) {
    console.warn(err);
  }
}
