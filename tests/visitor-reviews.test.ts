import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReview} from '../lib/visitor-reviews.ts';

const valid={name:'Aïcha',source:'friends',comment:'J’ai beaucoup aimé notre visite et l’accueil de l’équipe.',rating:5,consent:true,website:''};

test('Accept valid visitor reviews with optional ratings',()=>{
 const result=validateReview(valid);
 assert.equal(result.ok,true);
 if(result.ok){assert.equal(result.name,'Aïcha');assert.equal(result.source,'friends');assert.equal(result.rating,5);}
 const withoutRating=validateReview({...valid,rating:null});
 assert.equal(withoutRating.ok,true);
 if(withoutRating.ok)assert.equal(withoutRating.rating,null);
});

test('Reject missing consent, spam, links and invalid input',()=>{
 for(const value of [
  {...valid,consent:false},
  {...valid,website:'https://spam.example'},
  {...valid,comment:'Great'},
  {...valid,comment:'Check https://example.com for all information'},
  {...valid,source:'private'},
  {...valid,rating:6},
  {...valid,name:'<script>'}
 ])assert.equal(validateReview(value).ok,false);
});
