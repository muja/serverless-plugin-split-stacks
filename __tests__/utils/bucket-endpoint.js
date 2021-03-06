'use strict';

const test = require('ava');
const sinon = require('sinon');
const https = require('https');

const originalRequest = https.request;

test.beforeEach(t => {
  https.request = originalRequest;
  t.context = Object.assign(
    {},
    { serverless: { service: { provider: {} } } }
  );
});

test('sets correct deployment bucket for bucket in a region', t => {
  const setDeploymentBucketEndpoint = require('../../lib/deployment-bucket-endpoint');

  t.context.serverless.service.provider.deploymentBucket = 'danyel-test';
  t.context.options = { region: 'us-east-1' };
  const request = {};
  request.on = sinon.fake.returns(undefined);
  request.end = sinon.fake.returns(undefined);
  https.request = sinon.fake.returns(request);
  const promise = setDeploymentBucketEndpoint.apply(t.context, []);

  // assert called
  t.true(https.request.calledOnce);
  t.true(request.on.calledWith('response'));
  t.true(request.on.calledWith('error'));
  t.true(request.end.calledOnce);

  // invoke fake response
  const responseCall = request.on.getCalls().find(e => e.args[0] === 'response');
  const callback = responseCall.args[1];
  callback({ headers: { 'x-amz-bucket-region': 'eu-west-1' } });
  return promise.then(() => {
      t.deepEqual(t.context.deploymentBucketEndpoint, 's3.eu-west-1.amazonaws.com');
    });
});
